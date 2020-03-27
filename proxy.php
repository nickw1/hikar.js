<?php
$x = $_GET["x"];
$y = $_GET["y"];
$z = $_GET["z"];
header("Content-Type: image/png");
echo file_get_contents("https://s3.amazonaws.com/elevation-tiles-prod/terrarium/$z/$x/$y.png");
?>
