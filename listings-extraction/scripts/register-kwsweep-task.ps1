# Registers the Windows scheduled task that runs one nightly kwsweep window inside WSL.
# Run from WSL:  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w scripts/register-kwsweep-task.ps1)"
# Pause one night: touch output/kwsweep/STOP (WSL).  Stop the schedule:  Disable-ScheduledTask -TaskName 'RAR kwsweep nightly'
$name   = 'RAR kwsweep nightly'
$cmd    = 'wsl.exe -d Ubuntu-24.04 -u mikes -- /home/mikes/oregon-smb-directory/listings-extraction/scripts/kwsweep-nightly.sh'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -Command `"$cmd`""
$trigger = New-ScheduledTaskTrigger -Daily -At '21:30'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
            -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 11)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings `
  -Description 'RAR multi-keyword geo-grid sweep (lx kwsweep, rarlx stealth harvest), 9 h budget per night. Source: /home/mikes/oregon-smb-directory/listings-extraction/scripts/' -Force | Out-Null
Get-ScheduledTask -TaskName $name | Select-Object TaskName, State | Format-List
(Get-ScheduledTaskInfo -TaskName $name).NextRunTime
