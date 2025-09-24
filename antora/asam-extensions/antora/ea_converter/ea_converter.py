import os, sys
from pyquery import PyQuery
from pathlib import Path

"""This is the python component of the Enterprise Architect converter for Antora.
Currently, the python script is called by the Antora extension to read and convert the provided EA export files.

NOTE: It is recommended to integrate these features into the ea_extension.js file or create an accompanying helper file in JavaScript to reduce the overhead and increase performance by minimizing IO and other bottlenecks.
The python script was only developed because of a previous python script for another extension and better knowledge in Python development than JS development.
"""


def clean_content(content_array):
    """Cleans up an array of content by stripping it of line feed endings.

    Args:
        content_array (list(str)): The content array to be cleaned up.

    Returns:
        list: The cleaned up list stripped of line feed endings and leading/trailing spaces.
    """
    return [line.replace("\n","").strip() for line in content_array]


# Change to grabbing <div id="list"> from index.html
# Also, consider using the id="meta" information for creating additional page and adding it to the nav file
def get_navigation_structure(source_path,fname,target_path,module_path,navigation_title):
    """Determines the navigation file content from a source file and writes it into a nav.adoc file.

    Args:
        source_path (str): The path to the source file.
        fname (str): The filename of the source file (without the extension).
        target_path (str): The path where the module files will be located after conversion and integration.
        module_path (str): The path of the module. This is also where the navigation file will be located.
        navigation_title (str): The label for an initial non-page entry in the navigation file.

    Returns:
        pyquery: A pyquery on the provided document for body div#meta table.
    """

    content = ""
    nav_content = [":sectnums!:\n"]
    nav_content.append("* "+navigation_title+"\n\n")
    nav_content.append(":sectnums!:\n")
    nav_content.append("** xref:{target_path}meta.adoc[]\n".format(target_path=target_path+"/"))
    with open(source_path+"/"+fname+".html", "r") as file:
        content = file.read()

    pq = PyQuery(content)
    nav_list = pq('body div#list')
    level1 = nav_list('font.FrameHeadingFont')
    level2 = nav_list('font.FrameItemFont')
    for i in range(len(level1)):
        nav_content.append(":sectnums!:\n")
        nav_content.append("** " + level1.eq(i).text()+"\n")
        symbols = level2.eq(i)("span.DeprecatedSymbol")
        links = level2.eq(i)('a[title="class in uml"]')
        for j in range(len(symbols)):
            link_text = links.eq(j).text()
            if symbols.eq(j).text():
                link_text = "["+symbols.eq(j).text()+"\] " + link_text

            link_path = links.eq(j).attr('href').replace("./","").replace(".html",".adoc")
            if target_path:
                link_path = target_path + "/" + link_path

            nav_content.append(":sectnums!:\n")
            nav_content.append("*** xref:{link}[{label}]\n".format(link=link_path,label=link_text))

    
    with open(module_path+"/nav.adoc","w") as nav:
        nav.writelines(nav_content)

    return pq('body div#meta table')


def get_meta_information(meta_query,target_path):
    """Extractor for meta information. Creates a new adoc file containing the extracted meta information.

    Args:
        meta_query (pyquery): The query object with the extracted meta information.
        target_path (str): The location at which the new file is to be created at.

    Returns:
        str: The name of the created meta file.
    """

    html = meta_query.outer_html().split("\n")
    for i, line in enumerate(html):
        line = line.strip()
        if not line:
            html[i]="<br>"


    html_combined = "\n".join(html)
    body = "= Model meta information\n:page-width-limit: none\n\n++++\n"+html_combined+"\n++++\n"
    meta_file = "meta.adoc"
    with open(target_path+"/"+meta_file, 'w', encoding="utf-8") as file:
        file.write(body)

    return meta_file


def parse_file_and_create_adoc(source_path,fname,target_path):
    """Parses EA output and created adoc files with parsed content.

    Args:
        source_path (str): The path at which the source files are located.
        fname (str): The filename without extension.
        target_path (str): The path at which the converted adoc file is to be stored at.
    """

    content = " "
    title= " "
    body= " "
    with open(source_path+"/"+fname+".html", 'r') as source_file:
        content = source_file.read()

    pq = PyQuery(content)
    header_type = None
    if pq('h1:first'):
        title = pq('h1:first').text()
        header_type = 1
        has_title = True
    else:
        title = pq('h2:first').text()
        header_type = 2
        has_title = True
    if not title:
        has_title = False
        title_start = content.find("<title>")
        title_end = content.find("</title>")
        if not title_start == title_end:
            title = content[title_start+len("<title>"):title_end]
            header_type = 3

        else:
            title = fname
            header_type = 4


    current_header = "= " + title+"\n:page-width-limit: none\n\n"
    if has_title and header_type == 1:
        body = pq('div#contents').html().replace('<h1>{title}</h1>'.format(title=title),"")

    elif has_title and header_type == 2:
        body = pq('div#contents').html().replace('<h2>{title}</h2>'.format(title=title),"")

    else:
        body = pq('div#contents').html()

    if not body:
        body = ""

    # print (body)
    with open(target_path+"/"+fname+".adoc","w", encoding="utf-8") as file:
        file.write(current_header + "++++")
        file.write(body)
        file.write("\n++++\n\n")



def main(argv):
    """Main function of this script. Receives input parameters, set variables accordingly, and traverses through target folders to convert all found .html files into .adoc files.

    Args:
        argv (list): List of passed arguments. Expected content: [target_path, content_path_in_target, module_path_in_target, <obsolete>, module_content_path, source_path, navigation_title]
    """

    source_path = "ASAM_OSI_reference"
    target_path = "generated"
    target_content_path = target_path + "/converted"
    module_path = "../_antora/modules/ROOT"
    img_path = "../_attachments"
    module_content_path = ""
    navigation_title = "UML model"
    if len(argv)>=1 and argv[0]:
        target_path = argv[0]

    if len(argv)>=2 and argv[1]:
        target_content_path = argv[0]+"/"+argv[1]

    if len(argv)>=3 and argv[2]:
        module_path = argv[0]+"/"+argv[2]

    if len(argv)>=4 and argv[3]:
        img_path = argv[3]

    if len(argv)>=5 and argv[4]:
        module_content_path = argv[4]

    if len(argv)>=6 and argv[5]:
        source_path = argv[5]

    if len(argv)>=7 and argv[6]:
        navigation_title = argv[6]

    Path(target_path).mkdir(parents=True, exist_ok= True)
    Path(target_content_path).mkdir(parents=True, exist_ok= True)
    Path(module_path).mkdir(parents=True, exist_ok= True)

    for root, dirs, files in os.walk(source_path, followlinks=True):
        rel_path = os.path.relpath(root, source_path)
        rel_target_path = target_content_path
        if rel_path != ".":
            rel_target_path = "/".join([target_content_path,rel_path])
            Path(rel_target_path).mkdir(parents=True, exist_ok= True)

        for f in files:
            fname, extension = os.path.splitext(f)
            #----------
            # If the index.html is found, parse it as normal but also extract the meta file and the navigation file from it.
            #----------
            if f == "index.html":
                meta_query = get_navigation_structure(root,fname,module_content_path,module_path,navigation_title)
                get_meta_information(meta_query,rel_target_path)

            #----------
            # The top.html file is not useful in the Antora context, so it is skipped entirely.
            #----------
            elif f == "top.html":
                continue

            if extension == ".html":
                parse_file_and_create_adoc(root,fname,rel_target_path)


if __name__ == "__main__":
   main(sys.argv[1:])
