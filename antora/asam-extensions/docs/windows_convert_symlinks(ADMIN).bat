@ECHO OFF
SET Targetpath=.\modules\ROOT\pages
SET Symlinkroot=..\..\..\..

echo index.adoc
if exist %Targetpath%\index.adoc (
    del %Targetpath%\index.adoc
) 
mklink %Targetpath%\index.adoc %Symlinkroot%\README.adoc

SET Symlinkroot=..\..\..\..\..\..

for %%s in (antora core) do (
    echo checking to remove folder %%s
    if exist %Targetpath%\%%s\* (
        rd %Targetpath%\%%s
    ) else (
        if exist %Targetpath%\%%s (
            del %Targetpath%\%%s
        )
    ) 
    echo creating new folder %%s
    mkdir %Targetpath%\%%s
)

for %%s in (antora\asam_macros antora\attachments_generator antora\bibliography antora\consistent_numbering antora\crossref_replacement antora\doxygen_converter antora\ea_converter antora\keywords_overview antora\loft antora\nav_from_index antora\orphan_pages antora\reference_style_mixing) do (
    echo %%s
    if exist %Targetpath%\%%s\description.adoc (
        del %Targetpath%\%%s\description.adoc
    ) 
    
    if exist %Targetpath%\%%s\* (
        rd %Targetpath%\%%s
    ) else (
        if exist %Targetpath%\%%s (
            del %Targetpath%\%%s
        )
    ) 
    mkdir %Targetpath%\%%s
    mklink %Targetpath%\%%s\description.adoc %Symlinkroot%\%%s\description.adoc
)

PAUSE