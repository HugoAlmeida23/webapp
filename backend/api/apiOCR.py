import os
import tempfile
import json
import cv2
import pytesseract
from pdf2image import convert_from_path
import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key="AIzaSyBsvIslK8PDHHMNLs8eFENFjUDtOMlXpeQ")
model = genai.GenerativeModel("gemini-1.5-flash-8b")

# Get base directory and set up paths
base_dir = os.path.dirname(os.path.abspath(__file__))
poppler_path = os.path.join(base_dir, "..", "poppler-24.08.0", "library", "bin")

# Set Tesseract path if needed (comment out if Tesseract is in PATH)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'  # Linux/Mac

def perform_ocr(image_path, language='por+eng'):
    """Use Tesseract OCR to extract text from image"""
    try:
        # Read the image using OpenCV
        img = cv2.imread(image_path)
        
        # Preprocess image for better OCR results
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to handle variations in lighting
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Apply noise reduction
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        # Perform OCR with Tesseract
        custom_config = f'--oem 3 --psm 6 -l {language}'
        text = pytesseract.image_to_string(denoised, config=custom_config)
        
        return text
    except Exception as e:
        print(f"OCR error: {str(e)}")
        return ""

def process_with_gemini(ocr_text):
    """Process OCR text with Gemini AI to extract structured information"""
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
    É obrigatório associar uma classificação.
    
    ### **Exemplos de tipo de documento ("TD")**  
    - `"Fatura"`  
    - `"Fatura Simplificada"`  
    - `"Comprovante de Venda"`  
    - `"Nota de Débito"`  
    - `"Nota de Crédito"`  
    - `"Fatura Proforma"`  
    - `"Recibo"`  
    - `"Nota Fiscal Eletrônica"`  

    Analise cuidadosamente todos os aspectos do documento e não apenas os valores óbvios.
    Procure por padrões como "Contribuinte n°" ou "NIF" para identificar números fiscais.
    Examine o formato e conteúdo para determinar o tipo de documento.

    **Formato JSON esperado:**
    {{
        "A": "500123456",
        "B": "200654321",
        "C": "PT",
        "F": "2023-12-31",
        "G": "INV123456",
        "I4": "12.34",
        "I8": "45.67",
        "N": "58.01",
        "O": "200.00",
        "E": "Empresa XYZ",
        "ET": "Empresa",
        "CL": "76.1 - Trabalhos Especializados",
        "TD": "Fatura",
        "DESC": "Recibo de pagamento à empresa MultiCoffee"
    }}
    
    Se algum campo não for encontrado no texto, retorne `null`.  

    Retorne **SOMENTE** um JSON válido, sem explicações, texto adicional ou comentários.  

    ### **Texto do documento:**  
    {ocr_text}
    """

    try:
        # Call Gemini model to process the prompt
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response if it contains markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:].strip()
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()
        
        # Parse JSON response
        parsed_response = json.loads(response_text)
        return parsed_response
    except Exception as e:
        print(f"Error processing text with Gemini: {str(e)}")
        return {"error": f"Failed to process text: {str(e)}"}

def format_document_data(data):
    """Format the extracted data into the desired structure"""
    formatted_data = {
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
    return formatted_data

def AIProcess(pdf_input):
    """Main processing function that handles PDFs and extracts information"""
    try:
        # Handle different input types (file path or bytes)
        if isinstance(pdf_input, bytes):
            # Create a temporary file for bytes input
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(pdf_input)
                pdf_path = temp_file.name
            cleanup_temp = True
        else:
            # Use the provided file path
            pdf_path = pdf_input
            cleanup_temp = False
        
        # Convert PDF to images
        images = convert_from_path(pdf_path, poppler_path=poppler_path)
        
        results = []
        
        # Process each page of the PDF
        for i, image in enumerate(images):
            image_path = f"page_{i + 1}.png"
            try:
                # Save the image temporarily
                image.save(image_path, "PNG")
                
                # Perform OCR on the image
                ocr_text = perform_ocr(image_path)
                if not ocr_text.strip():
                    print(f"Warning: No text extracted from page {i+1}")
                    continue
                
                # Process the OCR text with Gemini AI
                gemini_response = process_with_gemini(ocr_text)
                
                # Format the extracted data
                formatted_data = format_document_data(gemini_response)
                
                results.append(formatted_data)
            finally:
                # Clean up temporary image file
                if os.path.exists(image_path):
                    os.remove(image_path)
        
        # Clean up temporary PDF file if it was created
        if cleanup_temp and os.path.exists(pdf_path):
            os.remove(pdf_path)
        
        # Return all results or just the first one if there's only one page
        return results[0] if len(results) == 1 else results
    
    except Exception as e:
        print(f"Error in AIProcess: {str(e)}")
        return {"error": f"Failed to process document: {str(e)}"}


# Example usage:
if __name__ == "__main__":
    # Example: process a PDF file
    result = AIProcess("path/to/your/document.pdf")
    print(json.dumps(result, indent=2))