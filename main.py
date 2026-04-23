import os
import requests
import json
from openai import OpenAI


languages = ["английский", "русский"]

def valid_words():
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    completion = client.chat.completions.create(
        model="openai/gpt-5.2",
        messages=[
            {
                "role": "user",
                "content": "What is the meaning of life?"
            }
        ]
    )

    print(completion)

def create_dict():
    lang1 = input("Введите язык 1: ")
    lang2 = input("Введите язык 2: ")
    name_file = lang1 + "-" + lang2
    with open(f"dicts/{name_file}", "x", encoding="UTF8") as f:
        pass
    print(f"Словарь {name_file} успешно создан")

def append_word():
    files = os.listdir('dicts')
    for i in range(len(files)):
        print(f"{i + 1}: {files[i]}")
    num_file = int(input("Выберите номер словаря: "))
    word1 = input("Введите слова для перевода: ")
    word2 = input("Введите перевод данного слова: ")
    with open(f"dicts/{files[num_file-1]}", "a", encoding="UTF8") as f:
        f.writelines(f"{word1}:{word2}")

def main():
    while True:
        select = input("1: Добавить словарь\n2: Добавить слова\nВаш выбор: ")
        match select:
            case "1":
                create_dict()
            case "2":
                append_word()

valid_words()