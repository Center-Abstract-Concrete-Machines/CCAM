# CCAM website

<pre>         _____                    _____                    _____                    _____          
         /\    \                  /\    \                  /\    \                  /\    \         
        /::\    \                /::\    \                /::\    \                /::\____\        
       /::::\    \              /::::\    \              /::::\    \              /::::|   |        
      /::::::\    \            /::::::\    \            /::::::\    \            /:::::|   |        
     /:::/\:::\    \          /:::/\:::\    \          /:::/\:::\    \          /::::::|   |        
    /:::/  \:::\    \        /:::/  \:::\    \        /:::/__\:::\    \        /:::/|::|   |        
   /:::/    \:::\    \      /:::/    \:::\    \      /::::\   \:::\    \      /:::/ |::|   |        
  /:::/    / \:::\    \    /:::/    / \:::\    \    /::::::\   \:::\    \    /:::/  |::|___|______  
 /:::/    /   \:::\    \  /:::/    /   \:::\    \  /:::/\:::\   \:::\    \  /:::/   |::::::::\    \ 
/:::/____/     \:::\____\/:::/____/     \:::\____\/:::/  \:::\   \:::\____\/:::/    |:::::::::\____\
\:::\    \      \::/    /\:::\    \      \::/    /\::/    \:::\  /:::/    /\::/    / ~~~~~/:::/    /
 \:::\    \      \/____/  \:::\    \      \/____/  \/____/ \:::\/:::/    /  \/____/      /:::/    / 
  \:::\    \               \:::\    \                       \::::::/    /               /:::/    /  
   \:::\    \               \:::\    \                       \::::/    /               /:::/    /   
    \:::\    \               \:::\    \                      /:::/    /               /:::/    /    
     \:::\    \               \:::\    \                    /:::/    /               /:::/    /     
      \:::\    \               \:::\    \                  /:::/    /               /:::/    /      
       \:::\____\               \:::\____\                /:::/    /               /:::/    /       
        \::/    /                \::/    /                \::/    /                \::/    /        
         \/____/                  \/____/                  \/____/                  \/____/     </pre>

Work in progress

Tags

-   Every Program, Project, and Resource requires a tag
-   Tags must not have trailing or leading whitespace

Frontmatter

-   Keys that are not defined in the `src/content/config.ts` will be ignored
-   Keys that are not handled in the layout for the page type will not be displayed

Images

-   Images must have lowercase file extensions [(issue 20)](https://github.com/parkerdavis1/CCAM/issues/20)
-   Program Gallery images can be placed in `src/content/programs/images/*` in a folder name of your choosing. Link the gallery images to your program's frontmatter with the `gallery` key (eg. `gallery: weird-dreams-slsa`)
    -   Previously they had to be in the `/public` folder but that is no longer true
