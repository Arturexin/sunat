from flask import Flask, request, jsonify
from flask_cors import CORS
from read_pdf import procesar_pdfs
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload-pdfs", methods=["POST"])
def upload_pdfs():
    # Validación de archivos
    if "pdfs" not in request.files or not request.files.getlist("pdfs"):
        return jsonify({"error": "No se enviaron archivos PDF"}), 400

    files = request.files.getlist("pdfs")

    # Guardar archivos
    for file in files:
        filename = file.filename
        if not filename.lower().endswith(".pdf"):
            continue  # Solo acepta archivos PDF
        path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(path)

    # Procesar PDFs
    try:
        resultados = procesar_pdfs()

        # Eliminar archivos subidos
        for file in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

        return jsonify({
            'status': 'success',
            'message': 'PDFs procesados correctamente',
            'data': resultados
            })
    except Exception as e:
        print("Error procesando PDFs:", e)
        return jsonify({
            'status': "error",
            'message': f"Error procesando PDFs: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)