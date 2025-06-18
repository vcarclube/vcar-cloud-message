const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "vcarclube-26a10",
  "private_key_id": "afc9dbafd7bd122004927062e605752a7c590769",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDjH/z/5BmQf8ad\nd+z8pY6RRLV3/l54C0BOluvzsMUtCn110AEg5/nAUcMXQf06rnbjf/+dBDfo9etl\noGKtx+Zu5zHzy0hytGrNEU4OY7/ucBZYOiafPrbS12oo689s9jAh86XcOcQiYrOK\n/1FUq5f/EJc5t13UFNmsBEixxxqrNed7Jr8k4j4lr9eyHkpT4+p01eSMIKRVfLrh\ngXsD5jDZo8cnl1gknSoN+qy/GAQl7BmIOfr8gguwR5B3M4vBNOKMLPe4Wd+Oh7oC\nREw4i7DQ7oTafT3bdY0h2Bo3u5zwC+3RlOZd+qaxK+HQFu4wh73FiRwOB6QZjS07\nKJsLe+k/AgMBAAECggEACxD0xEkKX9UsnwvdUvquusWUwUR2Y4tKIP950/VMc3iG\nirYi9UX9kBEhHCHTI0f7M0l6HF3nas/fSM6AOwRkO19uD86woyTG7A1ITCuFtKnn\nGiRh27IeuUt/+NTIgKrGx0Ng/50cQSqlodj1JFbPVeuqhUg5vPVzx6MBIbxYQHg3\n483TvXPOgHwDbfa8olRHqqd65Z0FURsJG/NrC2Q8U3hA2bQ352OvhDGFSCu8tC4M\nMYQ8g5sB1O8OekrqxT/qxTKaqGlJd/0SkAQ1kbMEH0fI5epuSTVSBNSiVKyNOMI+\nG/Nb5chf+1wvSU7JexoI5HgeQKJTuUYCPqGX0xl0rQKBgQD3BW5w1tMSASV20ATx\nT6Tu507XVJW4ZFwdz8OUSpdQQyCzDw50gNYZJNI8gQde3BlmZ1o8m7Xs5+KTdM6b\nR85tniiKiI9wOf77u02t0OX9TklJ9sxcl08HgXy9b57/y2kI+cOqgKclrrWOE69Z\no+mfGUiIolRLGIL0Av4WWB8UTQKBgQDrYWtTGyxs246Kd5dy/JwkUz6juxw1+Emv\nH01Jrwl/l06wC6zS8TBnu4YzXSE83z3zxJpCbskXleHZQ9zNuFHPol9aK+gpSryR\n4cdkHUgaL5UI1UmF6dDT1av9BOrt7kh4rTV5LyVRRop6ePz0xuoK212G0EhG7kZM\nCPi8T4bpuwKBgCAsfO4FjQhTTeXjwkEL9peHWSWCxt11dOoNHZQ7AupZU/D+jQtv\nnHM58Igg5izczhIgdAhg35kzurcqB58CA0kTyIQCtWwQob137+4rv0j24WTY2FVW\n/9wiaXTjDPqUK+IXZfzXNO4bi1ouBjDOwKcQS/o/6mq9jpDpst6GK8YhAoGBAMho\n0fCYmmK1LdBHsvN8kZV8K0FM9uAc3t/0TuIF3ph8Q8swpZ2VLhmkWMcy7DHgAeej\n5ZPar+0c+Ib8eOvPnBilr3ofGDTQJW4wRoy/QbzJ9qLmtwsF4X/71cxAe6bJ03qs\nP3NG6QcigJV2ninrkypbTG6UuHVsOv5SRTZQoBYxAoGAX4wZAehu/o4mGdzUSnNs\nHg5yd+f+3R5m2IXpjBYaQ1zicgX7dloj6flK0GTnF55IVMBg2SD0mtYdr/eCu3qg\ns0DOVUBeSmUv2+gcD5lF9XbAzrdZ7dTsGm2sT4meQn5oeAj7+cEgHzqqIk+VDaIA\n4iLL1zTx/yzg27S5oBNJuIc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@vcarclube-26a10.iam.gserviceaccount.com",
  "client_id": "116176925606232336780",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40vcarclube-26a10.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

module.exports = admin;