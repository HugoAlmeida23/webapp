import fitz  # PyMuPDF
from pyzbar.pyzbar import decode
import cv2
import numpy as np
import pyzbar.pyzbar as pyzbar

# Função para ler QR codes de uma imagem
def read_qr_code_from_image(image):
    qr_codes = decode(image)
    if qr_codes:
        for qr_code in qr_codes:
            qr_data = qr_code.data.decode('utf-8')
            print(f"QR Code Detected: {qr_data}")
            return qr_data
    else:
        print("No QR code found in the image.")
        return None

def extract_images_and_read_qr(file):
    # Read the file content into memory
    file_content = file.read()  # Read the entire file into memory
    
    # Open the PDF using PyMuPDF (fitz)
    doc = fitz.open(stream=file_content, filetype="pdf")  # Open the PDF from the file content
    
    # List to hold data from QR codes
    qr_data = []

    # Iterate over each page in the PDF and extract QR codes
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        img_list = page.get_images(full=True)
        
        for img_index, img in enumerate(img_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Convert the image data to an OpenCV format (numpy array)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Detect QR codes using pyzbar
            decoded_objects = pyzbar.decode(img)
            
            for obj in decoded_objects:
                qr_info = obj.data.decode('utf-8')  # Decode the QR code data
                
                # Parse QR code content into a structured dictionary (modify this based on your QR code structure)
                parsed_data = parse_qr_data(qr_info)
                qr_data.append(parsed_data)  # Store the structured data

    # Now return the structured data (list of dictionaries)
    return qr_data

def parse_qr_data(qr_info):
    parsed_data = {}

    # Split the qr_info by "*" to get individual key-value pairs
    key_value_pairs = qr_info.split("*")

    for pair in key_value_pairs:
        # Split by ":" to separate key and value
        if ":" in pair:
            key, value = pair.split(":", 1)
            parsed_data[key] = value
        else:
            # Handle cases where ":" is not found (invalid pair)
            print(f"Skipping invalid pair: {pair}")

    return parsed_data



# Função para formatar os dados para JSON conforme solicitado
def format_qr_data_for_json(qr_data_list):
    adjusted_data = []
    for data in qr_data_list:
        adjusted_data.append({
            "NIFEmpresa": data.get("A"),
            "NIF": data.get("B"),  # Número de contribuinte
            "Pais": data.get("C"),  # País
            "DataFatura": data.get("F"),  # Data da fatura
            "NumeroFatura": data.get("G"),  # Número da fatura
            "IVA6": data.get("I4"),  # IVA 6%
            "IVA23": data.get("I8"),  # IVA 23%
            "TotalIVA": data.get("N"),   # Total IVA
            "TotalFatura": data.get("O"), # Total Fatura
        })
    return adjusted_data
