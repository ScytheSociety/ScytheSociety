<?php
// Obtén los datos JSON que se enviaron
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Abre o crea un archivo de log para registrar los errores
$logFile = 'error_log.txt';
$message = "Fecha: " . date('Y-m-d H:i:s') . "\n";
$message .= "Error: " . $data['message'] . "\n";
$message .= "Stack Trace: " . $data['stack'] . "\n";
$message .= "---------------------------\n";

// Escribe el mensaje en el archivo
file_put_contents($logFile, $message, FILE_APPEND);

// Responde al cliente
echo json_encode(['status' => 'success']);
?>
