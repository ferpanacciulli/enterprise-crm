Set-Location "src/main/java"

$packages = @("entity","enums","repository","security","config","dto")

foreach ($pkg in $packages) {
    New-Item -ItemType Directory -Force -Path "com/enterprise/crm/$pkg" | Out-Null
    Get-ChildItem -Path $pkg -Filter *.java | Move-Item -Destination "com/enterprise/crm/$pkg"
    Get-ChildItem -Path "com/enterprise/crm/$pkg" -Filter *.java | ForEach-Object {
        (Get-Content $_.FullName) -replace "^package $pkg;", "package com.enterprise.crm.$pkg;" | Set-Content $_.FullName
    }
    Remove-Item -Path $pkg -Force -Recurse -ErrorAction SilentlyContinue
}

# arregla los imports en todo el proyecto
$replacements = @{
    "import entity\."     = "import com.enterprise.crm.entity."
    "import enums\."      = "import com.enterprise.crm.enums."
    "import repository\." = "import com.enterprise.crm.repository."
    "import security\."   = "import com.enterprise.crm.security."
    "import config\."     = "import com.enterprise.crm.config."
    "import dto\."        = "import com.enterprise.crm.dto."
}

Get-ChildItem -Path . -Filter *.java -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $changed = $false
    foreach ($pattern in $replacements.Keys) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacements[$pattern]
            $changed = $true
        }
    }
    if ($changed) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
    }
}

Write-Host "Listo. Verificando que no haya quedado ningun import roto..."
Get-ChildItem -Path . -Filter *.java -Recurse | Select-String -Pattern "^import (entity|enums|repository|security|config|dto)\."