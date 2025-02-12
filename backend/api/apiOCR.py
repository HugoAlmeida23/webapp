import os
import tempfile
from pdf2image import convert_from_path
import requests
import google.generativeai as genai
import json

# Configure Gemini API
genai.configure(api_key="AIzaSyBsvIslK8PDHHMNLs8eFENFjUDtOMlXpeQ")
model = genai.GenerativeModel("gemini-1.5-flash-8b")

base_dir = os.path.dirname(
    os.path.abspath(__file__)
)  # Get the current directory (backend/api)
poppler_path = os.path.join(
    base_dir, "..", "poppler-24.08.0", "library", "bin"
)  # Navigate up to backend/ and then into poppler/bin


def ocr_space_file(filename, overlay=False, api_key="K89182725288957", language="eng"):
    payload = {
        "isOverlayRequired": overlay,
        "apikey": api_key,
        "language": language,
    }
    with open(filename, "rb") as f:
        r = requests.post(
            "https://api.ocr.space/parse/image",
            files={filename: f},
            data=payload,
        )
    return r.content.decode()


def process_with_gemini(ocr_text):
    """Envia o resultado do OCR para a API Gemini para processamento e retorna um JSON formatado com os campos necessários."""

    # Melhorando o prompt para incluir a análise da classificação
    prompt = f"""
    Extraia as seguintes informações de um documento. O texto conterá os dados que você deve identificar e mapear para cada chave.  

    Os valores numéricos devem estar no formato `1.43` (com ponto) e não `1,43` (com vírgula).  

    ### **Campos a extrair:**  
    1. **NIF da empresa** - Chave `"A"`  
    2. **Número de contribuinte** - Chave `"B"`  
    3. **País** - Chave `"C"`  
    4. **Data do documento** - Chave `"F"`  
    5. **Número do documento** - Chave `"G"`  
    6. **IVA 6%** - Chave `"I4"`  
    7. **IVA 23%** - Chave `"I8"`  
    8. **Total IVA** - Chave `"N"`  
    9. **Total do documento** - Chave `"O"`  
    10. **Entidade emissora** - Chave `"E"`  
    11. **Tipo de entidade** - Chave `"ET"` (ex: Empresa, Instituição, Unipessoal Lda)  
    12. **Classificação** - Chave `"CL"`, conforme exemplos abaixo.  
    13. **Tipo de documento** - Chave `"TD"`, conforme exemplos abaixo.
    14. **Descrição** - Chave `"DESC"`, fazer análise do documento e de todos os campos e atribuir uma descrição correta ao documento, maximo 50 caracteres

    ### **Exemplos de classificação ("CL")**  
    A classificação do documento deve ser escolhida somente a partir da lista abaixo, com base no seu conteúdo:
    Prestação de Serviços → "72 - Prestação de Serviços"
    "72.1 - Consultoria Empresarial"
    "72.2 - Consultoria Fiscal"
    "72.3 - Desenvolvimento de Software"
    "72.4 - Serviços de Marketing"
    "72.5 - Tradução e Interpretação"
    Venda de Mercadorias → "73 - Venda de Mercadorias"
    "73.1 - Venda de Produtos"
    "73.2 - Vendas em Loja"
    Outros Serviços → "74 - Outros Serviços"
    "74.1 - Treinamentos"
    "74.2 - Serviços de Eventos"
    "74.3 - Serviços de Transporte"
    Despesas Operacionais → "75 - Despesas Operacionais"
    "75.1 - Aluguel"
    "75.2 - Energia Elétrica"
    "75.3 - Água e Esgoto"
    Fornecimentos e Serviços Externos → "76 - Fornecimentos e Serviços Externos"
    "76.1 - Trabalhos Especializados"
    "76.2 - Honorários"
    "76.3 - Comissões"
    "76.4 - Rendas e Aluguéis"
    "76.5 - Comunicação"
    "76.6 - Seguros"
    "76.7 - Royalties"
    Impostos e IVA → "77 - Impostos e IVA"
    "77.1 - IVA Suportado"
    "77.2 - IVA Dedutível"
    "77.3 - IVA Liquidado"
    Gastos com o Pessoal → "78 - Gastos com o Pessoal"
    "78.1 - Remunerações"
    "78.2 - Benefícios Pós-Emprego"
    "78.3 - Indemnizações"
    Juros e Encargos Financeiros → "79 - Juros e Encargos Financeiros"
    "79.1 - Juros Suportados"
    "79.2 - Diferenças de Câmbio"
    Se nenhuma das classificações acima puder ser determinada a partir do texto do documento, retorne "Indefinido".
    
    ### **Exemplos de tipo de documento ("TD")**  
    - `"Fatura"`  
    - `"Fatura Simplificada"`  
    - `"Comprovante de Venda"`  
    - `"Nota de Débito"`  
    - `"Nota de Crédito"`  
    - `"Fatura Proforma"`  
    - `"Recibo"`  
    - `"Nota Fiscal Eletrônica"`  

    **Exemplo do Formato JSON esperado:**
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
        "CL": "", # Classificação
        "TD": "Fatura"           # Tipo de documento
        "DESC" : "Recibo de pagamento à empresa MultiCoffee" #Descrição do documento
    }}
    
    Se algum campo não for encontrado no texto, retorne `null`.  

    Retorne **SOMENTE** um JSON válido, sem explicações, texto adicional ou comentários.  

    ### **Texto do documento:**  
    {ocr_text}
    """

    print("Texto enviado para análise:", ocr_text)

    try:
        # Chamando o modelo Gemini para processar o prompt
        response = model.generate_content(prompt)
        print("Resposta da API:", response.text)
        return response.text
    except Exception as e:
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
        "Descricao": data.get("DESC"),
    }
    return adjusted_data


# Main function
def AIProcess(pdf_path):
    # Check if pdf_path is a BytesIO object (for file-like object)
    if isinstance(pdf_path, bytes):
        # Create a temporary file to store the PDF content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
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
        image_path = f"page_{i + 1}.png"
        try:
            image.save(image_path, "PNG")

            # Perform OCR on the image and process it with Gemini
            ocr_result = ocr_space_file(filename=image_path, api_key="K89182725288957")
            gemini_response = process_with_gemini(ocr_result)
            gemini_response = (
                gemini_response.strip()
            )  # First, strip any extra spaces from the ends
            if gemini_response.startswith("```json"):
                gemini_response = gemini_response[
                    7:
                ].strip()  # Remove the starting ```json and leading spaces
            if gemini_response.endswith("```"):
                gemini_response = gemini_response[
                    :-3
                ].strip()  # Remove the trailing ```
            gemini_response = json.loads(gemini_response)
            print(gemini_response)
            adjusted_qr_data = format_qr_data_for_json(gemini_response)  # Ajuste aqui
            print(adjusted_qr_data)
            return adjusted_qr_data

        finally:
            if os.path.exists(image_path):
                os.remove(image_path)  # Ensure cleanup
