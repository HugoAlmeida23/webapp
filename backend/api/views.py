from django.contrib.auth.models import User
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from .serializers import UserSerializer, NoteSerializer, FaturaSerializer
from .models import Note, Fatura
from api import apiOCR
from supabase import create_client, Client
from django.conf import settings
import boto3
from botocore.exceptions import NoCredentialsError

# Initialize Supabase client (not used for file upload directly but may be used for DB interaction)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ACCESS_KEY  # Only two arguments needed for the Supabase client
)

def upload_to_supabase(file_path, file):
    try:
        # Initialize boto3 S3 client for Supabase storage
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS,
            endpoint_url=settings.ENDPOINT_URL  # Ensure this matches Supabase's S3 endpoint
        )

        # Upload the file to the Supabase bucket
        s3.upload_fileobj(
            file,
            settings.SUPABASE_BUCKET,  # Your Supabase bucket name
            file_path,
            ExtraArgs={'ContentType': file.content_type}
        )

        # Return the URL of the uploaded file
        file_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{file_path}"
        print(f"Upload successful! File URL: {file_url}")
        return file_url

    except NoCredentialsError:
        print("Credentials not found! Ensure your AWS credentials are correct.")
    except Exception as e:
        print(f"Error uploading file: {e}")
    return None


class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)


class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# Lista e cria faturas
class FaturaListCreate(generics.ListCreateAPIView):
    serializer_class = FaturaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # Permite envio de arquivos

    def get_queryset(self):
        return Fatura.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if 'file' in self.request.FILES:
            file = self.request.FILES['file']
            file_path = f"{self.request.user.username}/{file.name}"  # Caminho no Supabase
            print(file)
            print(file_path)

            # Faz o upload para o Supabase e obtém o URL
            file_url = upload_to_supabase(file_path, file)

            if not file_url:
                raise ValueError("Falha no upload do arquivo para Supabase.")

            # Se você já tem uma URL, faça o download do conteúdo do arquivo
            response = requests.get(file_url)
            if response.status_code != 200:
                raise ValueError("Erro ao baixar o arquivo.")

            # Processa o arquivo com o OCR (passando o conteúdo do arquivo)
            ocr_data = apiOCR.AIProcess(response.content)

            if not ocr_data:
                raise ValueError("Erro ao processar a fatura com OCR.")
            
            print("OCR Data:", ocr_data)
            
            # Verifique se ocr_data é uma lista e possui dados
            # Verifique se ocr_data é um dicionário e possui dados
            if isinstance(ocr_data, list) and ocr_data:  # Verifica se é uma lista e se não está vazia
                formatted_data = ocr_data[0]  # Pega o primeiro item da lista
            elif isinstance(ocr_data, dict) and ocr_data:
                formatted_data = ocr_data  # Se for um dicionário, usa diretamente
            else:
                raise ValueError("O formato dos dados do OCR está incorreto ou está vazio.")

            print("formatted_data content:", formatted_data)

            # Converte valores de forma segura
            iva_6 = None if formatted_data.get('IVA6') in ['null', None, ''] else formatted_data.get('IVA6')
            iva_23 = None if formatted_data.get('IVA23') in ['null', None, ''] else formatted_data.get('IVA23')
            total_iva = None if formatted_data.get('TotalIVA') in ['null', None, ''] else formatted_data.get('TotalIVA')
            total_fatura = None if formatted_data.get('TotalFatura') in ['null', None, ''] else formatted_data.get('TotalFatura')

            totalFatura = float(formatted_data.get('TotalFatura', '0.00').replace(',', '.')) if formatted_data.get('TotalFatura') else 0.00
            totalIVA = float(formatted_data.get('TotalIVA', '0.00').replace(',', '.')) if formatted_data.get('TotalIVA') else 0.00
            totalSemIVA = totalFatura - totalIVA

            # Cria a fatura com os dados extraídos
            serializer.save(
                user=self.request.user,
                description=formatted_data.get('Descricao', 'Descrição não encontrada'),
                nif=formatted_data.get('NIF', 'NIF não encontrado'),
                entidade=formatted_data.get('Entidade', 'Desconhecido'),
                pais=formatted_data.get('Pais', 'Pais não encontrado'),
                data=formatted_data.get('DataFatura', '2024-01-01'),
                numero_fatura=formatted_data.get('NumeroFatura', 'Número não encontrado'),
                iva_6=iva_6,
                iva_23=iva_23,
                total_iva=total_iva,
                total_sem_iva=totalSemIVA,
                total_fatura=total_fatura,
                tipo_entidade=formatted_data.get('TipoEntidade', 'Desconhecido'),
                classificacao=formatted_data.get('Classificacao', 'Desconhecido'),
                tipo=formatted_data.get('TipoDocumento', 'Desconhecido'),
                file_url=file_url  # Salva o link do Supabase
            )
            print("Fatura criada com os dados:", serializer.data)


        else:
            raise ValueError("Arquivo de fatura não enviado.")


# Deleta uma fatura
class FaturaDelete(generics.DestroyAPIView):
    serializer_class = FaturaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Fatura.objects.filter(user=self.request.user)

class FaturaUpdate(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        try:
            # Ensure the fatura exists and belongs to the user
            fatura = Fatura.objects.get(pk=pk, user=request.user)
            
            # Log incoming data for debugging
            print(f"Received data: {request.data}")
            
            serializer = FaturaSerializer(fatura, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_fatura = serializer.save()
                return Response({
                    'status': 'success',
                    'message': 'Fatura updated successfully',
                    'data': FaturaSerializer(updated_fatura).data
                }, status=status.HTTP_200_OK)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response({
                    'status': 'error',
                    'message': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Fatura.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Fatura not found or access denied'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'An unexpected error occurred',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# Gerencia Faturas (CRUD)
class FaturaViewSet(viewsets.ModelViewSet):
    queryset = Fatura.objects.all()
    serializer_class = FaturaSerializer
    parser_classes = (MultiPartParser, FormParser)

# Lista todas as entidades únicas
class EntidadeList(APIView):
    def get(self, request):
        entidades = Fatura.objects.values_list('entidade', flat=True).distinct()
        return Response(entidades, status=status.HTTP_200_OK)
