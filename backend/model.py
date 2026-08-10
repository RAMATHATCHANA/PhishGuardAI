import os
import joblib
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

class PhishingModel:
    def __init__(self):
        self.vectorizer = None
        self.classifier = None
        self.models_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(self.models_dir, exist_ok=True)
        
    def preprocess_text(self, text):
        """Preprocess text: lowercase, remove punctuation"""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def train(self, data_path=None):
        """Train the model on demo dataset"""
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), 'data', 'sample_phish.csv')
        
        print(f"Training model with data from {data_path}")
        df = pd.read_csv(data_path)
        
        # Preprocess texts
        df['processed_text'] = df['text'].apply(self.preprocess_text)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            df['processed_text'], df['label'], test_size=0.2, random_state=42
        )
        
        # TF-IDF vectorization
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            min_df=2,
            stop_words='english'
        )
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Train classifier
        self.classifier = LogisticRegression(max_iter=1000, random_state=42)
        self.classifier.fit(X_train_vec, y_train)
        
        # Evaluate
        train_score = self.classifier.score(X_train_vec, y_train)
        test_score = self.classifier.score(X_test_vec, y_test)
        print(f"Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
        
        # Save models
        vec_path = os.path.join(self.models_dir, 'vec.joblib')
        clf_path = os.path.join(self.models_dir, 'clf.joblib')
        joblib.dump(self.vectorizer, vec_path)
        joblib.dump(self.classifier, clf_path)
        print(f"Models saved to {self.models_dir}")
    
    def load(self):
        """Load trained models"""
        vec_path = os.path.join(self.models_dir, 'vec.joblib')
        clf_path = os.path.join(self.models_dir, 'clf.joblib')
        
        if os.path.exists(vec_path) and os.path.exists(clf_path):
            self.vectorizer = joblib.load(vec_path)
            self.classifier = joblib.load(clf_path)
            print("Models loaded successfully")
            return True
        return False
    
    def predict(self, text):
        """Predict phishing probability"""
        if self.vectorizer is None or self.classifier is None:
            raise ValueError("Model not loaded. Call load() or train() first.")
        
        processed = self.preprocess_text(text)
        vec = self.vectorizer.transform([processed])
        proba = self.classifier.predict_proba(vec)[0]
        
        # proba[1] is probability of phishing (class 1)
        return {
            'label': 'Phishing' if proba[1] > 0.5 else 'Safe',
            'score': float(proba[1])
        }

def ensure_model():
    """Ensure model is trained and loaded"""
    model = PhishingModel()
    if not model.load():
        print("Model files not found. Training new model...")
        model.train()
        model.load()
    return model

if __name__ == "__main__":
    # Train model if run directly
    model = PhishingModel()
    model.train()
