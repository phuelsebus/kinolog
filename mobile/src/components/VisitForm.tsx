import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { cinemaService, type OsmCinemaCandidate } from '../services/CinemaService';
import type { Cinema, TicketType } from '../types/models';

const DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Das Formular zeigt/erwartet das deutsche Datumsformat TT.MM.JJJJ, nach
// aussen (VisitFormValues, initialValues) bleibt es bei ISO (YYYY-MM-DD) -
// so wie es CreateCinemaVisitInput und die Postgres-Spalte watched_at erwarten.
function isoToGerman(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}

function germanToIso(de: string): string {
  const [day, month, year] = de.split('.');
  return `${year}-${month}-${day}`;
}

// Entfernt Nicht-Ziffern waehrend der Eingabe und setzt automatisch Punkte
// nach Tag/Monat, z.B. wird aus getippten "15012026" "15.01.2026".
function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.');
}

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'original', label: 'Originalticket' },
  { value: 'online', label: 'Online-Ticket' },
  { value: 'unknown', label: 'Unbekannt' },
];

export interface VisitFormValues {
  cinemaId: string;
  watchedAt: string;
  showTime?: string;
  hall?: string;
  row?: string;
  seat?: string;
  ticketPrice?: number;
  ticketType?: TicketType;
  rating?: number;
  comment?: string;
}

export interface VisitFormProps {
  // Movie-Poster/-Titel-Block, wird oben in der ScrollView gerendert. Bleibt
  // bewusst außerhalb dieser Komponente, da new-visit.tsx und edit-visit.tsx
  // hier unterschiedliche Inhalte zeigen (edit-visit.tsx zusätzlich "Film ändern").
  header: ReactNode;
  initialCinema?: Cinema | null;
  initialValues?: Partial<Omit<VisitFormValues, 'cinemaId'>>;
  submitLabel: string;
  submitErrorMessage: string;
  onSubmit: (values: VisitFormValues) => Promise<void>;
}

// Formular für die Kinobesuch-Details (idee.md: manuelle Eingabe). Geteilt
// zwischen new-visit.tsx (Anlegen) und edit-visit.tsx (Bearbeiten) - der Film
// selbst ist nicht Teil dieses Formulars, siehe VisitFormProps.header.
export default function VisitForm({
  header,
  initialCinema = null,
  initialValues,
  submitLabel,
  submitErrorMessage,
  onSubmit,
}: VisitFormProps) {
  // Kino: Suche + Neuanlage, da es dafuer keine externe API wie TMDB gibt.
  const [cinemaQuery, setCinemaQuery] = useState('');
  const [cinemaResults, setCinemaResults] = useState<Cinema[]>([]);
  const [searchingCinemas, setSearchingCinemas] = useState(false);
  const [osmCityQuery, setOsmCityQuery] = useState('');
  const [osmResults, setOsmResults] = useState<OsmCinemaCandidate[]>([]);
  const [searchingOsm, setSearchingOsm] = useState(false);
  const [osmSearched, setOsmSearched] = useState(false);
  const [creatingOsmCinema, setCreatingOsmCinema] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(initialCinema);
  const [showNewCinemaForm, setShowNewCinemaForm] = useState(false);
  const [newCinemaCity, setNewCinemaCity] = useState('');
  const [creatingCinema, setCreatingCinema] = useState(false);

  const [watchedAt, setWatchedAt] = useState(
    initialValues?.watchedAt ? isoToGerman(initialValues.watchedAt) : ''
  );
  const [showTime, setShowTime] = useState(initialValues?.showTime ?? '');
  const [hall, setHall] = useState(initialValues?.hall ?? '');
  const [row, setRow] = useState(initialValues?.row ?? '');
  const [seat, setSeat] = useState(initialValues?.seat ?? '');
  const [ticketPrice, setTicketPrice] = useState(
    initialValues?.ticketPrice !== undefined ? String(initialValues.ticketPrice) : ''
  );
  const [ticketType, setTicketType] = useState<TicketType | null>(initialValues?.ticketType ?? null);
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [comment, setComment] = useState(initialValues?.comment ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced lokale Kino-Suche waehrend der Nutzer tippt (bereits von
  // anderen Nutzern angelegte Kinos). Die OpenStreetMap-Suche (Overpass) wird
  // NICHT automatisch pro Tastenanschlag ausgeloest, sondern erst, wenn der
  // Nutzer explizit eine Stadt eingibt und "In dieser Stadt suchen" antippt
  // (siehe handleSearchOsm) - eine deutschlandweite Namenssuche war auf dem
  // kostenlosen Overpass-Dienst unzuverlaessig langsam, eine kleine
  // staedtische Bounding Box dagegen schnell (siehe supabase/functions/_shared/overpass.ts).
  useEffect(() => {
    const trimmed = cinemaQuery.trim();
    setOsmResults([]);
    setOsmSearched(false);
    if (selectedCinema || !trimmed) {
      setCinemaResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingCinemas(true);
      try {
        setCinemaResults(await cinemaService.searchCinemas(trimmed));
      } catch {
        setCinemaResults([]);
      } finally {
        setSearchingCinemas(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [cinemaQuery, selectedCinema]);

  async function handleSearchOsm() {
    const trimmedQuery = cinemaQuery.trim();
    const trimmedCity = osmCityQuery.trim();
    if (!trimmedQuery || !trimmedCity) return;
    setSearchingOsm(true);
    setError(null);
    try {
      const results = await cinemaService.searchCinemasOsm(trimmedQuery, trimmedCity);
      setOsmResults(results);
    } catch {
      setOsmResults([]);
      setError('OpenStreetMap-Suche fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSearchingOsm(false);
      setOsmSearched(true);
    }
  }

  async function handleSelectOsmCandidate(candidate: OsmCinemaCandidate) {
    setCreatingOsmCinema(true);
    setError(null);
    try {
      const cinema = await cinemaService.createCinema({
        name: candidate.name,
        address: candidate.address ?? undefined,
        city: candidate.city ?? undefined,
        country: candidate.country ?? undefined,
        latitude: candidate.latitude ?? undefined,
        longitude: candidate.longitude ?? undefined,
      });
      setSelectedCinema(cinema);
      setCinemaResults([]);
      setOsmResults([]);
      setOsmSearched(false);
      setOsmCityQuery('');
    } catch {
      setError('Kino konnte nicht übernommen werden.');
    } finally {
      setCreatingOsmCinema(false);
    }
  }

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
    if (!DATE_REGEX.test(watchedAt)) return 'Bitte ein gültiges Datum im Format TT.MM.JJJJ eingeben.';
    const [day, month, year] = watchedAt.split('.').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
      parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
    if (!isRealDate) return 'Das eingegebene Datum ist ungültig.';
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
      await onSubmit({
        cinemaId: selectedCinema!.id,
        watchedAt: germanToIso(watchedAt),
        showTime: showTime || undefined,
        hall: hall.trim() || undefined,
        row: row.trim() || undefined,
        seat: seat.trim() || undefined,
        ticketPrice: ticketPrice ? Number(ticketPrice.replace(',', '.')) : undefined,
        ticketType: ticketType ?? undefined,
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
      });
    } catch {
      setError(submitErrorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {header}

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

          {cinemaQuery.trim().length >= 3 && !searchingCinemas && cinemaResults.length === 0 ? (
            <View style={styles.osmSearchBlock}>
              <Text style={styles.osmLabel}>Kino nicht dabei? In OpenStreetMap suchen:</Text>
              <View style={styles.osmSearchRow}>
                <TextInput
                  style={[styles.input, styles.osmCityInput]}
                  placeholder="Stadt, z.B. Hamburg"
                  value={osmCityQuery}
                  onChangeText={setOsmCityQuery}
                />
                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleSearchOsm}
                  disabled={!osmCityQuery.trim() || searchingOsm}
                >
                  {searchingOsm ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Suchen</Text>
                  )}
                </Pressable>
              </View>

              {osmResults.map((candidate, index) => (
                <Pressable
                  key={`${candidate.name}-${index}`}
                  style={styles.cinemaResultRow}
                  onPress={() => handleSelectOsmCandidate(candidate)}
                  disabled={creatingOsmCinema}
                >
                  <Text>
                    {candidate.name}
                    {candidate.city ? ` · ${candidate.city}` : ''}
                  </Text>
                  {candidate.address ? <Text style={styles.osmAddress}>{candidate.address}</Text> : null}
                </Pressable>
              ))}

              {osmSearched && !searchingOsm && osmResults.length === 0 ? (
                <Text style={styles.osmEmptyText}>Keine Kinos in OpenStreetMap gefunden.</Text>
              ) : null}
            </View>
          ) : null}

          {cinemaQuery.trim() && !searchingCinemas && !searchingOsm ? (
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
        placeholder="TT.MM.JJJJ, z.B. 08.08.2026"
        keyboardType="number-pad"
        value={watchedAt}
        onChangeText={(text) => setWatchedAt(formatDateInput(text))}
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
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{submitLabel}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4, paddingBottom: 48 },
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
  osmSearchBlock: { marginTop: 8, gap: 8 },
  osmLabel: { color: '#666', fontSize: 13 },
  osmSearchRow: { flexDirection: 'row', gap: 8 },
  osmCityInput: { flex: 1 },
  osmAddress: { color: '#666', fontSize: 13 },
  osmEmptyText: { color: '#666', fontSize: 13 },
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
