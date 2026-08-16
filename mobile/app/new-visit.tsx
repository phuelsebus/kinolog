import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { cinemaService } from '../src/services/CinemaService';
import { cinemaVisitService } from '../src/services/CinemaVisitService';
import type { Cinema, TicketType } from '../src/types/models';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'original', label: 'Originalticket' },
  { value: 'online', label: 'Online-Ticket' },
  { value: 'unknown', label: 'Unbekannt' },
];

// Kinobesuch-Formular UI (idee.md: manuelle Eingabe der Kinobesuch-Details).
// Ersetzt den urspruenglich geplanten OCR-Bestaetigungsflow - Nutzerentscheidung
// 2026-08-13: Hauptflow ist manuelle Filmsuche + manuelle Detaileingabe.
export default function NewVisitScreen() {
  const router = useRouter();
  const { movieId, movieTitle, moviePosterUrl } = useLocalSearchParams<{
    movieId: string;
    movieTitle: string;
    moviePosterUrl?: string;
  }>();

  // Kino: Suche + Neuanlage, da es dafuer keine externe API wie TMDB gibt.
  const [cinemaQuery, setCinemaQuery] = useState('');
  const [cinemaResults, setCinemaResults] = useState<Cinema[]>([]);
  const [searchingCinemas, setSearchingCinemas] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [showNewCinemaForm, setShowNewCinemaForm] = useState(false);
  const [newCinemaCity, setNewCinemaCity] = useState('');
  const [creatingCinema, setCreatingCinema] = useState(false);

  const [watchedAt, setWatchedAt] = useState('');
  const [showTime, setShowTime] = useState('');
  const [hall, setHall] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced Kino-Suche waehrend der Nutzer tippt.
  useEffect(() => {
    if (selectedCinema || !cinemaQuery.trim()) {
      setCinemaResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingCinemas(true);
      try {
        const results = await cinemaService.searchCinemas(cinemaQuery);
        setCinemaResults(results);
      } catch {
        setCinemaResults([]);
      } finally {
        setSearchingCinemas(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [cinemaQuery, selectedCinema]);

  async function handleCreateCinema() {
    if (!cinemaQuery.trim()) return;
    setCreatingCinema(true);
    setError(null);
    try {
      const cinema = await cinemaService.createCinema({
        name: cinemaQuery.trim(),
        city: newCinemaCity.trim() || undefined,
      });
      setSelectedCinema(cinema);
      setShowNewCinemaForm(false);
      setCinemaResults([]);
    } catch {
      setError('Kino konnte nicht angelegt werden.');
    } finally {
      setCreatingCinema(false);
    }
  }

  function validate(): string | null {
    if (!selectedCinema) return 'Bitte ein Kino auswählen oder anlegen.';
    if (!DATE_REGEX.test(watchedAt)) return 'Bitte ein gültiges Datum im Format JJJJ-MM-TT eingeben.';
    if (Number.isNaN(Date.parse(watchedAt))) return 'Das eingegebene Datum ist ungültig.';
    if (showTime && !TIME_REGEX.test(showTime)) return 'Bitte eine gültige Uhrzeit im Format HH:MM eingeben.';
    if (ticketPrice && Number.isNaN(Number(ticketPrice.replace(',', '.')))) {
      return 'Bitte einen gültigen Preis eingeben.';
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await cinemaVisitService.createVisit({
        movieId,
        cinemaId: selectedCinema!.id,
        watchedAt,
        showTime: showTime || undefined,
        hall: hall.trim() || undefined,
        row: row.trim() || undefined,
        seat: seat.trim() || undefined,
        ticketPrice: ticketPrice ? Number(ticketPrice.replace(',', '.')) : undefined,
        ticketType: ticketType ?? undefined,
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch {
      setError('Kinobesuch konnte nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.movieRow}>
        {moviePosterUrl ? <Image source={{ uri: moviePosterUrl }} style={styles.poster} /> : null}
        <Text style={styles.movieTitle}>{movieTitle}</Text>
      </View>

      <Text style={styles.sectionLabel}>Kino *</Text>
      {selectedCinema ? (
        <View style={styles.selectedCinema}>
          <Text style={styles.selectedCinemaText}>
            {selectedCinema.name}
            {selectedCinema.city ? ` · ${selectedCinema.city}` : ''}
          </Text>
          <Pressable
            onPress={() => {
              setSelectedCinema(null);
              setCinemaQuery('');
            }}
          >
            <Text style={styles.changeLink}>Ändern</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Kino suchen..."
            value={cinemaQuery}
            onChangeText={(text) => {
              setCinemaQuery(text);
              setShowNewCinemaForm(false);
            }}
          />
          {searchingCinemas ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {cinemaResults.map((cinema) => (
            <Pressable
              key={cinema.id}
              style={styles.cinemaResultRow}
              onPress={() => {
                setSelectedCinema(cinema);
                setCinemaResults([]);
              }}
            >
              <Text>
                {cinema.name}
                {cinema.city ? ` · ${cinema.city}` : ''}
              </Text>
            </Pressable>
          ))}

          {cinemaQuery.trim() && !searchingCinemas ? (
            showNewCinemaForm ? (
              <View style={styles.newCinemaForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Stadt (optional)"
                  value={newCinemaCity}
                  onChangeText={setNewCinemaCity}
                />
                <Pressable style={styles.secondaryButton} onPress={handleCreateCinema} disabled={creatingCinema}>
                  {creatingCinema ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.secondaryButtonText}>"{cinemaQuery.trim()}" anlegen</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowNewCinemaForm(true)}>
                <Text style={styles.changeLink}>+ Neues Kino "{cinemaQuery.trim()}" anlegen</Text>
              </Pressable>
            )
          ) : null}
        </>
      )}

      <Text style={styles.sectionLabel}>Datum *</Text>
      <TextInput
        style={styles.input}
        placeholder="JJJJ-MM-TT, z.B. 2026-08-08"
        value={watchedAt}
        onChangeText={setWatchedAt}
      />

      <Text style={styles.sectionLabel}>Uhrzeit</Text>
      <TextInput style={styles.input} placeholder="HH:MM, z.B. 20:15" value={showTime} onChangeText={setShowTime} />

      <View style={styles.row3}>
        <View style={styles.row3Item}>
          <Text style={styles.sectionLabel}>Saal</Text>
          <TextInput style={styles.input} value={hall} onChangeText={setHall} />
        </View>
        <View style={styles.row3Item}>
          <Text style={styles.sectionLabel}>Reihe</Text>
          <TextInput style={styles.input} value={row} onChangeText={setRow} />
        </View>
        <View style={styles.row3Item}>
          <Text style={styles.sectionLabel}>Sitz</Text>
          <TextInput style={styles.input} value={seat} onChangeText={setSeat} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Preis (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="z.B. 14.90"
        keyboardType="decimal-pad"
        value={ticketPrice}
        onChangeText={setTicketPrice}
      />

      <Text style={styles.sectionLabel}>Tickettyp</Text>
      <View style={styles.ticketTypeRow}>
        {TICKET_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.ticketTypeChip, ticketType === option.value && styles.ticketTypeChipActive]}
            onPress={() => setTicketType(ticketType === option.value ? null : option.value)}
          >
            <Text style={ticketType === option.value ? styles.ticketTypeTextActive : styles.ticketTypeText}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Bewertung</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(rating === n ? 0 : n)}>
            <Text style={styles.star}>{n <= rating ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Notiz</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
        value={comment}
        onChangeText={setComment}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Speichern</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4, paddingBottom: 48 },
  movieRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  poster: { width: 60, height: 90, borderRadius: 6 },
  movieTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  sectionLabel: { fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  selectedCinema: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedCinemaText: { fontSize: 15, flexShrink: 1 },
  changeLink: { color: '#2563eb', marginTop: 6 },
  cinemaResultRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  newCinemaForm: { marginTop: 8, gap: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '600' },
  row3: { flexDirection: 'row', gap: 8 },
  row3Item: { flex: 1 },
  ticketTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ticketTypeChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ticketTypeChipActive: { backgroundColor: '#111', borderColor: '#111' },
  ticketTypeText: { color: '#111' },
  ticketTypeTextActive: { color: '#fff' },
  starsRow: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 32, color: '#f5a623' },
  error: { color: '#c0392b', marginTop: 12 },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
