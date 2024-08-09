if ($args.Length -eq 0) {
    #Indicate usage
    Write-Host "Usage: ./update_event.ps1 <event_id>"
    return
} else {
    $event_id = $args[0]
}

$task_id = 3
$title = 'ChangedTitle'
$description = 'ChangedDescription'
$date = Get-Date -Format "yyyy-MM-dd"
$place = 'Place'

$method = "PUT"
$uri = "http://localhost:4000/events/$event_id"

$body = @{
    #task_id = $task_id
    #title = $title
    #description = $description
    #date = $date
    place = $place
}

Invoke-RestMethod -Method $method -Uri $uri -Body ($body | ConvertTo-Json) -ContentType "application/json"