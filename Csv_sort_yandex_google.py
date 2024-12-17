import csv

def sort_and_save(input_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        combined_rows = list(reader)

    # колонка B (Яндекс)
    sorted_rows_yandex = sorted(combined_rows, key=lambda x: (int(x[1]) if x[1].isdigit() else float('inf')))
    with open("E:\\WORK\\Python\\SeoScraper\\Yandex.csv", 'w', newline='', encoding='utf-8') as yandex_file:
        writer = csv.writer(yandex_file)
        writer.writerows(sorted_rows_yandex)
    print("Yandex sorted file saved as Yandex.csv")

    # колонка D (Google)
    sorted_rows_google = sorted(combined_rows, key=lambda x: (int(x[3]) if x[3].isdigit() else float('inf')))
    with open("E:\\WORK\\Python\\SeoScraper\\Google.csv", 'w', newline='', encoding='utf-8') as google_file:
        writer = csv.writer(google_file)
        writer.writerows(sorted_rows_google)
    print("Google sorted file saved as Google.csv")

sort_and_save("/combined_old+6.csv")