import os
import tempfile
from pdf2image import convert_from_path
import requests
import google.generativeai as genai
import json 

# Configure Gemini API
genai.configure(api_key="AIzaSyBsvIslK8PDHHMNLs8eFENFjUDtOMlXpeQ")
model = genai.GenerativeModel("gemini-1.5-flash-8b")

base_dir = os.path.dirname(os.path.abspath(__file__))  # Get the current directory (backend/api)
poppler_path = os.path.join(base_dir, '..', 'poppler-24.08.0', 'library', 'bin')  # Navigate up to backend/ and then into poppler/bin

def ocr_space_file(filename, overlay=False, api_key='K89182725288957', language='eng'):
    payload = {'isOverlayRequired': overlay,
               'apikey': api_key,
               'language': language,
               }
    with open(filename, 'rb') as f:
        r = requests.post('https://api.ocr.space/parse/image',
                          files={filename: f},
                          data=payload,
                          )
    return r.content.decode()

# Function to process OCR result with Gemini API
def process_with_gemini(ocr_text):
    """Send OCR result to Gemini API for further processing and return formatted JSON with additional fields."""
    
    # Melhorando o prompt para incluir as novas informações
    prompt = f"""
    Extraia as seguintes informações de um texto de fatura. O texto conterá os dados que você deve identificar e mapear para cada chave. Retorne os dados no formato JSON especificado abaixo:

    1. **NIF da empresa** - Representado pela chave "A"
    2. **Número de contribuinte** - Representado pela chave "B"
    3. **País** - Representado pela chave "C"
    4. **Data da fatura** - Representado pela chave "F"
    5. **Número da fatura** - Representado pela chave "G"
    6. **IVA 6%** - Representado pela chave "I4"
    7. **IVA 23%** - Representado pela chave "I8"
    8. **Total IVA** - Representado pela chave "N"
    9. **Total da fatura** - Representado pela chave "O"
    10. **Entidade** - Representado pela chave "E" (a entidade que emitiu a fatura)
    11. **Tipo de entidade** - Representado pela chave "ET" (ex: empresa, instituição)
    12. **Classificação** - Representado pela chave "CL" (ex: tipo de classificação fiscal)
    13. **Tipo de documento** - Representado pela chave "TD" (ex: fatura, recibo)

    Por favor, identifique cada um desses campos no texto a seguir e os retorne no formato JSON conforme o exemplo abaixo.

    Formato JSON esperado:
    {{
        "A": "500123456",        # NIF da empresa
        "B": "200654321",        # Número de contribuinte
        "C": "PT",               # País
        "F": "2023-12-31",       # Data da fatura
        "G": "INV123456",        # Número da fatura
        "I4": "12.34",           # IVA 6%
        "I8": "45.67",           # IVA 23%
        "N": "58.01",            # Total IVA
        "O": "200.00",           # Total da fatura
        "E": "Empresa XYZ",      # Entidade
        "ET": "Empresa",         # Tipo de entidade
        "CL": "Fiscal",          # Classificação
        "TD": "Fatura"           # Tipo de documento
    }}
    Se algum campo não for encontrado ou não estiver presente no texto, retorne `null` ou um valor vazio para o campo correspondente.

    O texto para análise:
    {ocr_text}
    """
    
    try:
        # Chamando o modelo Gemini para processar o prompt
        response = model.generate_content(prompt)
        # Retorna o texto da resposta do modelo
        print(response.text)
        return response.text
    except Exception as e:
        # Caso ocorra um erro, retorna uma mensagem de erro
        print(f"Erro ao processar o texto com Gemini: {str(e)}")
        return {"error": "Erro ao processar o texto."}

def format_qr_data_for_json(data):
    """Format the QR data extracted from the Gemini API response."""
    # Ajustando para tratar um dicionário único em vez de uma lista
    adjusted_data = {
        "NIFEmpresa": data.get("A"),
        "NIF": data.get("B"),
        "Pais": data.get("C"),
        "DataFatura": data.get("F"),
        "NumeroFatura": data.get("G"),
        "IVA6": data.get("I4"),
        "IVA23": data.get("I8"),
        "TotalIVA": data.get("N"),
        "TotalFatura": data.get("O"),
        "Entidade": data.get("E"),
        "TipoEntidade": data.get("ET"),
        "Classificacao": data.get("CL"),
        "TipoDocumento": data.get("TD"),
    }
    return adjusted_data


# Main function
def AIProcess(pdf_path):
    # Check if pdf_path is a BytesIO object (for file-like object)
    if isinstance(pdf_path, bytes):
        # Create a temporary file to store the PDF content
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_file.write(pdf_path)
            temp_pdf_path = temp_file.name

        # Now pass the temp file path to convert_from_path
        images = convert_from_path(temp_pdf_path, poppler_path=poppler_path)
        
        # Clean up the temporary file after conversion
        os.remove(temp_pdf_path)
    else:
        # If pdf_path is a file path, just process it normally
        images = convert_from_path(pdf_path, poppler_path=poppler_path)

    for i, image in enumerate(images):
        image_path = f"page_{i+1}.png"
        try:
            image.save(image_path, 'PNG')

            # Perform OCR on the image and process it with Gemini
            ocr_result = ocr_space_file(filename=image_path, api_key='K89182725288957')
            gemini_response = process_with_gemini(ocr_result)
            gemini_response = gemini_response.strip()  # First, strip any extra spaces from the ends
            if gemini_response.startswith('```json'):
                gemini_response = gemini_response[7:].strip()  # Remove the starting ```json and leading spaces
            if gemini_response.endswith('```'):
                gemini_response = gemini_response[:-3].strip()  # Remove the trailing ```
            gemini_response = json.loads(gemini_response)
            print(gemini_response)
            adjusted_qr_data = format_qr_data_for_json(gemini_response)  # Ajuste aqui
            print(adjusted_qr_data)
            return adjusted_qr_data
        
        finally:
            if os.path.exists(image_path):
                os.remove(image_path)  # Ensure cleanup
