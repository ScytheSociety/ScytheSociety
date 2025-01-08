<?php
$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    $file = "game_data.json";
    $currentData = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    $currentData[] = $data;

    file_put_contents($file, json_encode($currentData, JSON_PRETTY_PRINT));
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error"]);
}
?>
