from flask import Flask, render_template, request, jsonify, send_file
import numpy as np
import random
import os
import json
import pickle
import subprocess
from pathlib import Path
import tensorflow as tf
from music21 import stream, note, tempo, meter, key
import tempfile
import uuid
import pygame
import wave

app = Flask(__name__)

# Initialize pygame mixer for audio playback
pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=1024)

# Load model and mappings on startup
MODEL_PATH = 'models/ai_music_model.keras'
MAPPINGS_PATH = 'models/note_mappings.pkl'
METADATA_PATH = 'models/model_metadata.json'

# Global variables
model = None
note_mappings = None
metadata = None

def load_ai_model():
    """Load the AI music model and mappings"""
    global model, note_mappings, metadata
    
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        
        with open(MAPPINGS_PATH, 'rb') as f:
            note_mappings = pickle.load(f)
        
        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
            
        print("✅ AI Music Model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def generate_music_sequence(num_notes=100, temperature=1.0, seed=None):
    """Generate music using the AI model"""
    if model is None:
        return None
    
    int_to_note = note_mappings['int_to_note']
    note_to_int = note_mappings['note_to_int']
    sequence_length = note_mappings['sequence_length']
    vocab_size = len(int_to_note)
    
    # Set random seed for reproducibility if provided
    if seed:
        random.seed(seed)
        np.random.seed(seed)
    
    # Initialize sequence
    current_sequence = [random.randint(0, vocab_size - 1) for _ in range(sequence_length)]
    generated_notes = []
    
    try:
        for i in range(num_notes):
            input_sequence = np.array([current_sequence], dtype=np.int32)
            prediction = model.predict(input_sequence, verbose=0)[0]
            
            # Apply temperature
            if temperature != 1.0:
                prediction = np.log(np.clip(prediction, 1e-7, 1.0)) / temperature
                exp_preds = np.exp(prediction)
                prediction = exp_preds / np.sum(exp_preds)
            
            # Ensure prediction is valid
            prediction = np.clip(prediction, 1e-7, 1.0)
            prediction = prediction / np.sum(prediction)
            
            next_note_idx = np.random.choice(len(prediction), p=prediction)
            
            # Handle dictionary key conversion properly
            try:
                next_note_idx = int(next_note_idx)
                
                if next_note_idx in int_to_note:
                    next_note = str(int_to_note[next_note_idx])
                elif str(next_note_idx) in int_to_note:
                    next_note = str(int_to_note[str(next_note_idx)])
                else:
                    first_key = list(int_to_note.keys())[0]
                    next_note = str(int_to_note[first_key])
                
            except (KeyError, TypeError, ValueError) as e:
                next_note = 'C4'
                next_note_idx = 0
            
            generated_notes.append(next_note)
            current_sequence = current_sequence[1:] + [int(next_note_idx)]
            
    except Exception as e:
        print(f"Error during music generation: {e}")
        return None
    
    return generated_notes

def notes_to_midi(notes, output_path, tempo_bpm=120):
    """Convert notes to MIDI file"""
    try:
        composition = stream.Stream()
        composition.append(tempo.TempoIndication(number=tempo_bpm))
        composition.append(meter.TimeSignature('4/4'))
        composition.append(key.KeySignature(0))
        
        for note_name in notes:
            try:
                if note_name and note_name != 'REST' and note_name.strip():
                    clean_note = str(note_name).strip()
                    if clean_note:
                        new_note = note.Note(clean_note)
                        new_note.quarterLength = 0.5
                        composition.append(new_note)
            except Exception as note_error:
                continue
        
        composition.write('midi', fp=output_path)
        return output_path
    except Exception as e:
        print(f"Error creating MIDI: {e}")
        return None

def create_browser_compatible_audio(notes, output_path, tempo_bpm=120):
    """Create a simple audio representation for browser playback"""
    try:
        # Note to frequency mapping
        note_frequencies = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77, 'C3': 130.81,
            'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
            'A3': 220.00, 'B3': 246.94
        }
        
        # Generate audio data
        sample_rate = 22050
        note_duration = 60.0 / tempo_bpm  # Duration per beat
        
        audio_data = []
        for i, note_name in enumerate(notes[:60]):  # Limit to prevent long processing
            if note_name in note_frequencies:
                freq = note_frequencies[note_name]
                t = np.linspace(0, note_duration, int(sample_rate * note_duration))
                
                # Create a more musical envelope (attack, decay, sustain, release)
                envelope = np.ones_like(t)
                attack_samples = int(0.1 * len(t))
                release_samples = int(0.1 * len(t))
                
                if attack_samples > 0:
                    envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
                if release_samples > 0:
                    envelope[-release_samples:] = np.linspace(1, 0, release_samples)
                
                # Generate sine wave with envelope
                wave_data = np.sin(2 * np.pi * freq * t) * envelope * 0.3
                audio_data.extend(wave_data)
            else:
                # Add silence for unknown notes
                silence = np.zeros(int(sample_rate * note_duration))
                audio_data.extend(silence)
        
        if audio_data:
            # Convert to 16-bit audio
            audio_array = np.array(audio_data, dtype=np.float32)
            audio_array = np.clip(audio_array, -1.0, 1.0)
            audio_array = np.int16(audio_array * 32767)
            
            # Save as WAV file
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 2 bytes per sample
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_array.tobytes())
            
            return True
        return False
        
    except Exception as e:
        print(f"Audio generation error: {e}")
        return False

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', metadata=metadata)

@app.route('/generate', methods=['POST'])
def generate_music():
    """Generate AI music"""
    try:
        # Get parameters from request
        data = request.json
        num_notes = int(data.get('num_notes', 80))
        temperature = float(data.get('temperature', 1.0))
        tempo = int(data.get('tempo', 120))
        seed = data.get('seed', None)
        
        # Convert seed to int if provided
        if seed and str(seed).strip():
            try:
                seed = int(seed)
            except ValueError:
                seed = None
        
        # Validate parameters
        num_notes = max(20, min(200, num_notes))
        temperature = max(0.1, min(2.0, temperature))
        tempo = max(60, min(200, tempo))
        
        # Generate music
        generated_notes = generate_music_sequence(num_notes, temperature, seed)
        
        if generated_notes is None or len(generated_notes) == 0:
            return jsonify({'error': 'Failed to generate music - no notes produced'}), 500
        
        # Create unique filename
        unique_id = str(uuid.uuid4())[:8]
        midi_filename = f'generated_music_{unique_id}.mid'
        audio_filename = f'generated_music_{unique_id}.wav'
        
        midi_path = os.path.join('static', midi_filename)
        audio_path = os.path.join('static', audio_filename)
        
        # Create static directory if it doesn't exist
        os.makedirs('static', exist_ok=True)
        
        # Save as MIDI
        midi_result = notes_to_midi(generated_notes, midi_path, tempo)
        if not midi_result:
            return jsonify({'error': 'Failed to create MIDI file'}), 500
        
        # Create browser-compatible audio
        audio_success = create_browser_compatible_audio(generated_notes, audio_path, tempo)
        
        return jsonify({
            'success': True,
            'midi_url': f'/static/{midi_filename}',
            'audio_url': f'/static/{audio_filename}' if audio_success else None,
            'notes_preview': generated_notes[:10] if len(generated_notes) >= 10 else generated_notes,
            'total_notes': len(generated_notes),
            'parameters': {
                'num_notes': num_notes,
                'temperature': temperature,
                'tempo': tempo
            }
        })
        
    except Exception as e:
        print(f"Generation route error: {e}")
        return jsonify({'error': f'Generation failed: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    """Download generated files"""
    file_path = os.path.join('static', filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return "File not found", 404

@app.route('/about')
def about():
    """About page with model information"""
    return render_template('about.html', metadata=metadata)

if __name__ == '__main__':
    # Load model on startup
    if load_ai_model():
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load AI model. Please check model files.")
