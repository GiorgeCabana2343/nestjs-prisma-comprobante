# 🚀 Pruebas de API para la Aplicación Backend del Registro de Comprabante 

Este documento describe cómo realizar pruebas y verificar las funcionalidades de la API de gestión de vouchers utilizando Postman (o cualquier cliente REST compatible).

**La aplicación backend debe estar en ejecución antes de realizar estas pruebas.**

## ⚙️ Requisitos Previos

Asegúrate de que tu entorno esté preparado:

* **Aplicación Backend en Ejecución:** Confirma que la aplicación NestJS está corriendo en modo desarrollo.
    * Si no lo está, inicia la base de datos con `docker-compose up -d` y luego la aplicación con `npm run start:dev`.
* **Postman (o similar):** Tener instalado y configurado un cliente REST para realizar las peticiones HTTP.

## 💡 Endpoints de Prueba con Postman

Todos los endpoints deben ser prefijados con la **Base URL de la API:** `http://localhost:3000` (o el puerto configurado en tu archivo `.env`).

---

### **1. Gestión Básica de Vouchers (`/voucher`)**

#### **1.1 Crear un Nuevo Voucher**
* **Método:** `POST`
* **URL:** `/voucher`
* **Body (JSON):**
    ```json
    {
      "companyId": "PT-TEST-01",
      "supplierRuc": "20123456789",
      "invoiceNumber": "TEST-V-001",
      "amount": 50.00,
      "issueDate": "2025-06-18",
      "documentType": "FACTURA"
    }
    ```
* **Esperado:** Un código de estado `201 Created` y los datos del voucher creado.

#### **1.2 Obtener Todos los Vouchers**
* **Método:** `GET`
* **URL:** `/voucher`
* **Esperado:** Un código de estado `200 OK` y un array de objetos voucher.

#### **1.3 Obtener Vouchers por Estado**
* **Método:** `GET`
* **URL:** `/voucher?state=validated`
* **Descripción:** Filtra vouchers por el estado `validated`.
* **Esperado:** `200 OK` y un array de vouchers con el estado especificado. Puedes probar con otros estados como `pending`, `rejected`, etc., si tu lógica los soporta.

#### **1.4 Obtener Vouchers con Paginación**
* **Método:** `GET`
* **URL:** `/voucher?page=1&limit=100`
* **Descripción:** Recupera la primera página con hasta 1000 vouchers. Ajusta `page` y `limit` según tu necesidad.
* **Esperado:** `200 OK` y un array de vouchers paginado.

#### **1.5 Obtener Vouchers por Rango de Fechas y Paginación**
* **Método:** `GET`
* **URL:** `/voucher?startDate=2025-05-13&endDate=2025-06-23&page=1&limit=100`
* **Descripción:** Filtra vouchers por rango de fechas de emisión y aplica paginación.
* **Esperado:** `200 OK` y un array de vouchers dentro del rango de fechas.

#### **1.6 Obtener Vouchers por Tipo de Documento**
* **Método:** `GET`
* **URL:** `/voucher?documentType=FACTURA`
* **Descripción:** Filtra vouchers que son de tipo 'FACTURA'.
* **Esperado:** `200 OK` y un array de vouchers del tipo 'FACTURA'. Puedes probar con otros tipos como 'BOLETA' si existen.

#### **1.7 Actualizar el Estado de un Voucher**
* **Método:** `PUT`
* **URL:** `/voucher/9/estado`
* **Descripción:** Actualiza el estado del voucher con el ID `9` a `validated`.
    * **Importante:** Reemplaza `9` con un ID de voucher **existente** en tu base de datos obtenido de una petición `GET`.
* **Body (JSON):**
    ```json
    {
      "state": "validated"
    }
    ```
* **Esperado:** `200 OK` y los datos actualizado del voucher.

---

### **2. Exportación de Datos (`/voucher/export-csv`)**

#### **2.1 Exportar Vouchers a CSV con Filtros**
* **Método:** `GET`
* **URL:** `/voucher/export-csv?state=pending&documentType=FACTURA`
* **Descripción:** Genera un archivo CSV de vouchers, filtrados por estado 'pending' y tipo de documento 'FACTURA'.
* **Proceso en Postman:**
    1.  Configura la petición `GET` con la URL y los parámetros de consulta deseados.
    2.  Haz clic en el botón **"Send"** (Enviar).
    3.  En la ventana de respuesta, Postman detectará que la respuesta es un archivo CSV (debido al `Content-Type: text/csv` y `Content-Disposition: attachment`).
    4.  Verás un botón **"Send and Download"** (o similar, dependiendo de la versión de Postman) o una opción para **"Download"** la respuesta en la sección del cuerpo de la respuesta. Haz clic en él para guardar el archivo `.csv` en tu equipo.

* **Esperado:** Un código de estado `200 OK` y la descarga directa de un archivo `.csv` en tu cliente Postman. El contenido del archivo será una tabla de datos de vouchers.


### **3. Consultas Avanzadas con IA (`/voucher/OPEN-IA`)**

#### **3.1 Realizar Consultas en Lenguaje Natural**
* **Método:** `POST`
* **URL:** `/voucher/OPEN-IA`
* **Body (JSON):**
    ```json
    { "question": "¿Cuál es el total de todas las facturas?" }
    ```
* **Descripción:** Envía una pregunta en lenguaje natural al módulo de IA para obtener análisis y respuestas sobre los datos de los vouchers.
* **Esperado:** `200 OK` y una respuesta JSON que contenga el resultado de la consulta de IA (ej., `{ "answer": "El total de todas las facturas es $X.XX" }`).

    **Otros ejemplos de preguntas que puedes probar:**
    * `{ "question": "¿Cuál es el total de todas las boletas?" }`
    * `{ "question": "¿Cuál fue el total de vouchers validados en junio?" }` (Ajusta el mes al de tus datos de prueba)
    * `{ "question": "¿Cuántos vouchers validated hay?" }`

---