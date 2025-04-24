import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Test tokenization
text = "This is a test sentence."
tokens = word_tokenize(text)
print("Tokens:", tokens)

# Test stopwords
stop_words = set(stopwords.words('english'))
filtered_tokens = [word for word in tokens if word.lower() not in stop_words]
print("Filtered Tokens (without stopwords):", filtered_tokens)
