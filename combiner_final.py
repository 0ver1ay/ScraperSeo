import csv
import pandas as pd
import os


# Функция сортировки файлов в папке по первому столбцу
def format_and_sort_csv(file_path):
    # Read CSV into a list of lists
    with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        data = [row for row in reader]

    
    data.sort(key=lambda x: x[0])

    
    num_columns = len(data[0])

    
    for col in range(1, num_columns):
        data.sort(key=lambda x: x[col])

    
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(data)


def process_files_in_folder(folder_path):
    files = os.listdir(folder_path)

    for file in files:
    
        if file.endswith('.csv'):
            file_path = os.path.join(folder_path, file)
            format_and_sort_csv(file_path)


folder_path = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\in"
process_files_in_folder(folder_path)

source_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\original.csv"

folder_path = os.path.dirname(source_file)


in_path = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\in"
source_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\original.csv"
final_file = "E:\\WORK\\Python\\SeoScraper\\all files combined\\final\\final.csv"


dataframe = pd.read_csv(source_file, sep=';', usecols=[0], header=None)


for filename in os.listdir(in_path):
    if filename.endswith(".csv"):
        file_path = os.path.join(in_path, filename)
        data = pd.read_csv(file_path, sep=';', usecols=[1], header=None)
        if len(pd.read_csv(file_path, sep=';', index_col=None)) == 1999:
            dataframe = pd.concat([dataframe, data], axis=1)
            print(filename)

dataframe.to_csv(final_file, index=False, header=False)

print("Файл final.csv успешно обновлен.")




