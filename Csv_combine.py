import os
import csv
import datetime
import shutil

def combine_csv_files(directory, output_directory):
    csv_files = [f for f in os.listdir(directory) if f.endswith('.csv')]

    if not csv_files:
        print("В директории не найдено CSV-файлов.")
        return

    combined_rows = []

    for file in csv_files:
        print(f"Обработка файла {file}...")

        with open(os.path.join(directory, file), 'r', encoding='utf-8') as infile:
            reader = csv.reader(infile)

            # Пропускаем первые три ряда
            for _ in range(3):
                next(reader, None)

            for row in reader:
                combined_rows.append(row)

    current_date = datetime.datetime.now().strftime('%Y-%m-%d')
    output_file = os.path.join(output_directory, f"combined_{current_date}.csv")

    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(combined_rows)

    print(f"Объединенный файл сохранен как {output_file}")
    shutil.copy(output_file, "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\in")
    print(f"Файл скопирован в папку для обработки")

combine_csv_files("files", "E:\\WORK\\Python\\SeoScraper\\all files combined")
