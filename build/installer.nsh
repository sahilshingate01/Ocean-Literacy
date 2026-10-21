; Ocean Literacy Custom NSIS Installer Script
; Adds custom greetings, registry hooks, and protocol registration

!macro customHeader
  !system "echo 'Custom NSIS header inclusion for Ocean Literacy Desktop'"
!macroend

!macro customInstall
  DetailPrint "Registering Ocean Literacy URI Scheme (ocean-literacy://)..."
  WriteRegStr HKCR "ocean-literacy" "" "URL:Ocean Literacy Protocol"
  WriteRegStr HKCR "ocean-literacy" "URL Protocol" ""
  WriteRegStr HKCR "ocean-literacy\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "ocean-literacy\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  DetailPrint "Removing Ocean Literacy URI Scheme..."
  DeleteRegKey HKCR "ocean-literacy"
!macroend
