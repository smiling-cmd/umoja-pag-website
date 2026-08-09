param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

$publicRoot = Join-Path $ProjectRoot 'domain-root\public_html'
$frontendFiles = @(
    'index.html',
    'about.html',
    'ministries.html',
    'events.html',
    'giving.html',
    'connect.html',
    'privacy-policy.html',
    'index.css',
    'home-hero.css',
    'ministries.css',
    'index.js'
)

foreach ($file in $frontendFiles) {
    $source = Join-Path $ProjectRoot $file
    $deployed = Join-Path $publicRoot $file

    if (!(Test-Path -LiteralPath $source)) {
        throw "Missing source frontend file: $file"
    }

    if (!(Test-Path -LiteralPath $deployed)) {
        throw "Missing deployed frontend file: $file"
    }

    $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    $deployedHash = (Get-FileHash -LiteralPath $deployed -Algorithm SHA256).Hash

    if ($sourceHash -ne $deployedHash) {
        throw "Frontend copies differ: $file"
    }
}

$apiFiles = Get-ChildItem -LiteralPath (Join-Path $publicRoot 'api') -Filter '*.php' -File

foreach ($apiFile in $apiFiles) {
    & php -l $apiFile.FullName

    if ($LASTEXITCODE -ne 0) {
        throw "PHP syntax check failed: $($apiFile.Name)"
    }
}

foreach ($htmlFile in Get-ChildItem -LiteralPath $ProjectRoot -Filter '*.html' -File) {
    $content = Get-Content -LiteralPath $htmlFile.FullName -Raw

    if ($content -notmatch '<meta\s+name=["' + "'" + ']description') {
        throw "Missing meta description: $($htmlFile.Name)"
    }

    if (([regex]::Matches($content, '<h1\b')).Count -ne 1) {
        throw "Expected exactly one H1: $($htmlFile.Name)"
    }
}

Write-Host 'Project verification passed.' -ForegroundColor Green
