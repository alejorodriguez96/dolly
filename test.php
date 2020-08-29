<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header("Access-Control-Allow-Headers: X-Requested-With");


$captcha = $_POST['response'];
if (!$captcha) {
  echo "Por favor verifica el captcha";
}

$SECRET_KEY = getenv("RECAPTCHA_SECRET_KEY");
$response = json_decode(file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=$SECRET_KEY&response=$captcha"));

if ($response->success) {
  // Guardo la data
  $fichero = 'gente.txt';
  $rows_number = 13;
  if( isset($_POST["pio"]) ){
    $data = trim($_POST["pio"]);
    if( substr_count($data, ',') % $rows_number == 0){
      file_put_contents($fichero, $data."\n", FILE_APPEND | LOCK_EX);
      echo $_POST["pio"];
    }else{
      echo "PHP is not running";
    }
  }else{
    echo "PHP is running";
  }
} else {
  // Error
  print_r(json_encode(array('status' => 'error', 'message' => 'No valid Captcha')));
}

?>
