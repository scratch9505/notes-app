import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json'; // Adjust path if amplify_outputs.json is elsewhere
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify
Amplify.configure(amplifyConfig);

// Create the Amplify Data client
const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });

  // Fetch all notes
  const fetchNotes = async () => {
    const { data } = await client.models.Note.list();
    setNotes(data);
  };

  // Create a new note
  const createNote = async () => {
    const { name, description, image } = formData;
    if (!name || !description) return;

    const newNote = await client.models.Note.create({ name, description });

    if (image) {
      await client.storage.put(image.name, image);
      await client.models.Note.update({
        id: newNote.data.id,
        image: image.name
      });
    }

    setFormData({ name: '', description: '', image: null });
    fetchNotes();
  };

  // Delete a note
  const deleteNote = async (noteId) => {
    await client.models.Note.delete({ id: noteId });
    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ padding: '2rem' }}>
          <h1>Hello, {user.username}</h1>
          <button onClick={signOut}>Sign out</button>

          <h2>Create Note</h2>
          <input
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <button onClick={createNote}>Create</button>

          <h2>Notes</h2>
          {notes.map(note => (
            <div key={note.id}>
              <h3>{note.name}</h3>
              <p>{note.description}</p>
              {note.image && (
                <img
                  src={client.storage.getUrl(note.image)}
                  alt=""
                  width="200"
                />
              )}
              <button onClick={() => deleteNote(note.id)}>Delete</button>
            </div>
          ))}
        </main>
      )}
    </Authenticator>
  );
}
