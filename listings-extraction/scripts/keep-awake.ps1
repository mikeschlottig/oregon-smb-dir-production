# keep-awake.ps1 — hold Windows awake (system required, display may sleep) while a kwsweep window runs.
# Exits when the sentinel file disappears (the wrapper deletes it when the run ends) or after -Hours, whichever is first.
# No admin, no power-plan change: SetThreadExecutionState is released when this process ends.
param([double]$Hours = 10, [string]$Sentinel)
Add-Type -Namespace KwAwake -Name Native -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);'
$ES_CONTINUOUS = [uint32]2147483648; $ES_SYSTEM_REQUIRED = [uint32]1
$end = (Get-Date).AddHours($Hours)
[KwAwake.Native]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED) | Out-Null
while ((Get-Date) -lt $end -and (-not $Sentinel -or (Test-Path -LiteralPath $Sentinel))) { Start-Sleep -Seconds 60 }
[KwAwake.Native]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
