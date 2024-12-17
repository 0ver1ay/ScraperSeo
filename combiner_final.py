import csv
import pandas as pd
import os


# Функция сортировки файлов в папке по первому столбцу
def format_and_sort_csv(file_path):
    # Read CSV into a list of lists
    with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        data = [row for row in reader]

    # Sort list of lists by first element
    data.sort(key=lambda x: x[0])

    # Get the number of columns
    num_columns = len(data[0])

    # Sort all columns based on the first column
    for col in range(1, num_columns):
        data.sort(key=lambda x: x[col])

    # Write sorted list of lists back to the CSV file
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(data)

# Функция для обработки всех файлов в папке
def process_files_in_folder(folder_path):
    # Получаем список файлов в папке
    files = os.listdir(folder_path)

    # Проходим по каждому файлу
    for file in files:
        # Проверяем, что файл имеет расширение .csv
        if file.endswith('.csv'):
            # Составляем полный путь к файлу
            file_path = os.path.join(folder_path, file)

            # Применяем функцию format_and_sort_csv к файлу
            format_and_sort_csv(file_path)

# Пример использования
folder_path = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\in"
process_files_in_folder(folder_path)

source_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\original.csv"

folder_path = os.path.dirname(source_file)

# Пути к файлам
in_path = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\in"
source_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\original.csv"
final_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\final.csv"

# Читаем первый файл
dataframe = pd.read_csv(source_file, sep=';', usecols=[0], header=None)

# Обрабатываем остальные файлы
for filename in os.listdir(in_path):
    if filename.endswith(".csv"):
        file_path = os.path.join(in_path, filename)
        data = pd.read_csv(file_path, sep=';', usecols=[1], header=None)
        if len(pd.read_csv(file_path, sep=';', index_col=None)) == 1999:
            dataframe = pd.concat([dataframe, data], axis=1)
            print(filename)
# Сохраняем результат в файл
dataframe.to_csv(final_file, index=False, header=False)

print("Файл final.csv успешно обновлен.")




