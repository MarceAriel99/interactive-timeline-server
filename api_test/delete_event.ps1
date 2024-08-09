if ($args.Length -eq 0) {
    #Indicate usage
    Write-Host "Usage: ./delete_event_by_id.ps1 <event_id>"
    return
} else {
    $event_id = $args[0]
}
$method = "DELETE"
$uri = "http://localhost:4000/events/$event_id"

Invoke-RestMethod -Method $method -Uri $uri 