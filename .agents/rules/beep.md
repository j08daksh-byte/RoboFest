# Beep on Task Completion

Whenever you finish your entire task, provide your final report to the user, or stop working for the current prompt, you MUST run the following PowerShell command as your very last action to produce 3 loud beeps. This alerts the user that they can provide their next prompt.

```powershell
powershell -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\chord.wav').PlaySync(); (New-Object Media.SoundPlayer 'C:\Windows\Media\chord.wav').PlaySync(); (New-Object Media.SoundPlayer 'C:\Windows\Media\chord.wav').PlaySync()"
```

Always execute this command via the `run_command` tool right before concluding your response.
