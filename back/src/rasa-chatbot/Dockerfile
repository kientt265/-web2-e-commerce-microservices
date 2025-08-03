FROM rasa/rasa:3.6.10

WORKDIR /app

COPY . /app

# (Optional) If you have custom actions, uncomment the next line
# RUN pip install -r actions/requirements.txt

EXPOSE 5005

CMD ["run", "--enable-api", "--cors", "*"]