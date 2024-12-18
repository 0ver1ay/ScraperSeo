import xml.etree.ElementTree as ET

def is_desired_url(url):
    #    return url.startswith("https://renokom.ru/katalog/renault/logan-1/")
    return url.startswith("https://renokom.ru/katalog/renault/megane-2/") and url.endswith("megane-2/")

sitemap_file_path = "E:\\WORK\\Python\\SeoScraper\\sitemap cleaner\\sitemap.xml"

tree = ET.parse(sitemap_file_path)
root = tree.getroot()

filtered_urls = []
for url in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url"):
    loc = url.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text
    if is_desired_url(loc):
        filtered_urls.append(loc)

output_file_path = "E:\\WORK\\Python\\SeoScraper\\sitemap cleaner\\filtered_urls.txt"
with open(output_file_path, "w") as f:
    for url in filtered_urls:
        f.write(url + "\n")

print("Отфильтрованные URL-адреса успешно записаны в файл:", output_file_path)
