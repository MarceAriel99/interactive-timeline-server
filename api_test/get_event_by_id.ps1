if ($args.Length -eq 0) {
    $event_id = 19
} else {
    $event_id = $args[0]
}
$method = "GET"
$uri = "http://localhost:4000/events/$event_id"

Invoke-RestMethod -Method $method -Uri $uri 