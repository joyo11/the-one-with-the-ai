"""Phase 2 — train.

Fine-tune DistilBERT on classifier/data/clean/lines.csv to predict which of
the six main Friends characters spoke each line.

Targets the local Mac M2 GPU via MPS; falls back to CPU if MPS unavailable.
Saves the best model (by val accuracy) and tokenizer to classifier/models/.
"""

import csv
import json
import random
from pathlib import Path

import numpy as np
import torch
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset
from transformers import (
    DistilBertForSequenceClassification,
    DistilBertTokenizerFast,
    Trainer,
    TrainingArguments,
)

# --- paths ---
REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = REPO_ROOT / "classifier" / "data" / "clean" / "lines.csv"
MODEL_DIR = REPO_ROOT / "classifier" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# --- hyperparams ---
MODEL_NAME = "distilbert-base-uncased"
LABELS = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"]
LABEL2ID = {name: i for i, name in enumerate(LABELS)}
ID2LABEL = {i: name for name, i in LABEL2ID.items()}

MAX_LEN = 96       # most lines are short; >95th percentile fits in 96 tokens
BATCH_SIZE = 32
EPOCHS = 3
LR = 2e-5
SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


def device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_rows() -> tuple[list[str], list[int]]:
    texts, labels = [], []
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(row["line"])
            labels.append(LABEL2ID[row["speaker"]])
    return texts, labels


class LineDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.enc = tokenizer(
            texts,
            truncation=True,
            max_length=MAX_LEN,
            padding="max_length",
            return_tensors="pt",
        )
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids": self.enc["input_ids"][idx],
            "attention_mask": self.enc["attention_mask"][idx],
            "labels": self.labels[idx],
        }


def compute_metrics(pred):
    """Overall accuracy. Per-character F1 lives in eval.py."""
    logits, labels = pred
    preds = logits.argmax(axis=-1)
    return {"accuracy": (preds == labels).mean().item()}


def main():
    dev = device()
    print(f"Device: {dev}")
    print(f"Loading {CSV_PATH.relative_to(REPO_ROOT)}")
    texts, labels = load_rows()
    print(f"  {len(texts):,} rows")

    # 80/10/10 stratified split
    X_train, X_tmp, y_train, y_tmp = train_test_split(
        texts, labels, test_size=0.20, stratify=labels, random_state=SEED
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=SEED
    )
    print(f"  train: {len(X_train):,}  val: {len(X_val):,}  test: {len(X_test):,}")

    # Persist the test split so eval.py reads exactly what train.py held out
    test_path = MODEL_DIR / "test_split.json"
    with open(test_path, "w") as f:
        json.dump({"texts": X_test, "labels": y_test}, f)
    print(f"  test split saved to {test_path.relative_to(REPO_ROOT)}")

    print(f"Loading tokenizer + model: {MODEL_NAME}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    train_ds = LineDataset(X_train, y_train, tokenizer)
    val_ds = LineDataset(X_val, y_val, tokenizer)

    args = TrainingArguments(
        output_dir=str(MODEL_DIR / "checkpoints"),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE * 2,
        learning_rate=LR,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        logging_steps=100,
        save_total_limit=1,
        seed=SEED,
        report_to="none",
        # MPS doesn't support fp16; bf16 is unstable here. Stick with fp32.
        fp16=False,
        bf16=False,
        # MPS sometimes hates pin_memory + workers
        dataloader_pin_memory=False,
        dataloader_num_workers=0,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    print(f"Training: {EPOCHS} epochs, batch {BATCH_SIZE}, lr {LR}, max_len {MAX_LEN}")
    trainer.train()

    print(f"Saving best model to {MODEL_DIR.relative_to(REPO_ROOT)}")
    trainer.save_model(str(MODEL_DIR / "best"))
    tokenizer.save_pretrained(str(MODEL_DIR / "best"))

    print()
    print("=== Final val metrics ===")
    final = trainer.evaluate()
    for k, v in final.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
