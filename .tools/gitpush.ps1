#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$PublisherRoot,
    [Parameter(Mandatory = $true)][string]$Allowlist,
    [Parameter(Mandatory = $true)][string]$Message,
    [switch]$Yes,
    [switch]$StagedOnly,
    [string]$ExpectedCommit = ''
)
$ErrorActionPreference = 'Stop'
$helper = Join-Path ([IO.Path]::GetFullPath($PublisherRoot)) '.tools/gitpush.ps1'
if (-not (Test-Path -LiteralPath $helper -PathType Leaf)) { throw 'The qualified Grout-Library publication owner is unavailable.' }
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
& $helper -RepositoryRoot $root -Target 'grout13' -Allowlist $Allowlist -Message $Message -Yes:$Yes -StagedOnly:$StagedOnly -ExpectedCommit $ExpectedCommit
