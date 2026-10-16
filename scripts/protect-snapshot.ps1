param(
  [Parameter(Mandatory=$true)][ValidateSet('Protect','Read','Verify')][string]$Action,
  [Parameter(Mandatory=$true)][string]$Path,
  [string]$PayloadBase64
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$snapshotPath = [System.IO.Path]::GetFullPath($Path)
if ($Action -eq 'Protect') {
  $snapshotRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../backups'))
  if (-not $snapshotPath.StartsWith($snapshotRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Snapshot must stay inside this workspace backups directory.' }
  if (Test-Path -LiteralPath $snapshotPath) { throw 'Refusing to overwrite an existing snapshot.' }
  [System.IO.Directory]::CreateDirectory($snapshotRoot) | Out-Null
  $bytes = [Convert]::FromBase64String($PayloadBase64)
  $protected = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
  [System.IO.File]::WriteAllBytes($snapshotPath, $protected)
}
$encrypted = [System.IO.File]::ReadAllBytes($snapshotPath)
$clear = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
$json = [System.Text.Encoding]::UTF8.GetString($clear)
if ($Action -eq 'Read') { [Console]::Out.Write($json); exit }
$snapshot = $json | ConvertFrom-Json -AsHashtable
if ($snapshot.format -ne 'mgzavri-application-snapshot-v1') { throw 'Unexpected snapshot format.' }
$counts = @{}
foreach ($entry in $snapshot.tables.GetEnumerator()) { $counts[$entry.Key] = @($entry.Value).Count }
@{ file=$snapshotPath; encryption='Windows DPAPI CurrentUser'; verified=$true; counts=$counts } | ConvertTo-Json -Compress -Depth 5
