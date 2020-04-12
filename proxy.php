<?php
$x = $_GET["x"];
$y = $_GET["y"];
$z = $_GET["z"];
if(ctype_digit($x) && ctype_digit($y) && ctype_digit($z)) {
    header("Content-Type: image/png");
    echo file_get_contents("https://s3.amazonaws.com/elevation-tiles-prod/terrarium/$z/$x/$y.png");
} else {
    header("HTTP/1.1 400 Bad Request");
    echo "invalid x, y and/or z params";
}
?>
