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

Staging site (dev branch)
[https://dev--ccamworldlive.netlify.app/](https://dev--ccamworldlive.netlify.app/)

Public facing site (main branch)
[https://ccamworldlive.netlify.app/](https://ccamworldlive.netlify.app/)

Actual domain
[https://ccam.world/](https://ccam.world/)

## Templates

-   Each content type (people, programs, projects, resources) has an associated _template.mdx file in each content folder. Duplicate this file, edit the data, and rename the file (making sure to remove the leading underscore _). Use mdx extension for all files, in case you want to include components in the markdown like `<LinkButton />`.

## Using LinkButton component in mdx files

<!-- prettier-ignore-start -->
```mdx
---
// frontmatter
---
# Heading

Hello register below!

<LinkButton text="display text" url="https://www.ccam.world" />
```
<!-- prettier-ignore-end -->

-   Files needs to be .mdx to use custom components
-   **You no longer need to import the LinkButton or YouTube components, they are automatically made available in resources, programs, and projects.**

## Create a program gallery

-   To create a new program photo gallery, put all the gallery images in a folder in `src/content/galleries/*`. The name of this folder will serve as the gallery ID.
-   Run `npm run gallery` in the terminal. This will scaffold a gallery content file in `/src/content/galleries/`.
-   To add captions or attributions, open the gallery content file and add relevant metadata for individual photos as needed.
-   Add the gallery ID to your programs frontmatter with the `gallery` key (eg `gallery: weird-dreams-slsa`)

### Ordering photos in a gallery

-   Photos will be ordered by filename when you generate the gallery template file. The easiest way to order gallery photos is to rename the gallery photos before you run the gallery script.
-   Once the gallery template file is created however, you can manually order photos by reordering the [image objects](#example-image-object) in the gallery template frontmatter. The gallery template file is the source of truth.

#### Example image object:

```md
-   image: src/content/galleries/2024-05-FRM-Chicago/20240511_105733.jpg
    caption: null
    credit: null
    includeInAssProject: false
```
