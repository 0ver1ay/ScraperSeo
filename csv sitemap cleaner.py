import csv

def is_desired_url(url):
    return url.startswith("https://renokom.ru/katalog/renault/duster-1/") # and url.endswith("/sandero-1/")

input_csv_file_path = "E:\\WORK\\Python\\SeoScraper\\sitemap cleaner\\sitemap.csv"
output_csv_file_path = "E:\\WORK\\Python\\SeoScraper\\sitemap cleaner\\filtered_urls.csv"

filtered_urls = []
with open(input_csv_file_path, newline='', encoding='utf-8') as csvfile:
    csvreader = csv.reader(csvfile)
    for row in csvreader:
        if row:
            url = row[0]
            if is_desired_url(url):
                filtered_urls.append([url])

with open(output_csv_file_path, mode='w', newline='', encoding='utf-8') as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerows(filtered_urls)

print("Отфильтрованные URL-адреса успешно записаны в файл:", output_csv_file_path)
