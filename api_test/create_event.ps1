#$task_id = 1
$title = 'TestTitle'
$description = 'TestDescription'
$date = Get-Date -Format "yyyy-MM-dd"
$place = 'TestPlace'

$method = "POST"
$uri = "http://localhost:4000/events"

$body = @{
    #task_id = $task_id
    title = $title
    description = $description
    date = $date
    place = $place
}

Invoke-RestMethod -Method $method -Uri $uri -Body ($body | ConvertTo-Json) -ContentType "application/json"