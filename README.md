# Website Deekman Enterprises — zo zet je hem live

De website van Deekman Enterprises: 8 pagina's, werkende formulieren, een website-bouwer en een gratis website-check die echt meet via Google PageSpeed.

- **Komt te staan op:** https://deekmanenterprises.com (www stuurt door)
- **Hosting:** GitHub Pages, net als Paginapuls, het Werknemersportaal en Leerpuls
- **Formulieren:** Supabase Edge Function `Website`, die via Resend naar info@deekmanenterprises.com mailt

## Wat zit erin

| Bestand | Wat het is |
|---|---|
| `index.html` | Home |
| `diensten.html` | Wat we doen |
| `apps.html` | Onze apps |
| `binnenkort.html` | Binnenkort + aanmelden voor updates |
| `contact.html` | Contactformulier |
| `website-bouwer.html` | Stel je website samen (live voorbeeld + wensen versturen) |
| `website-check.html` | Gratis website-check |
| `privacy.html` | Privacyverklaring |
| `404.html` | Pagina voor adressen die niet bestaan |
| `style.css`, `site.js`, `js/…` | Opmaak en werking |
| `foto-thomas.jpg` | Je foto bij "Over ons" |
| `config.js` | Instellingen (adres van de formulierfunctie, optionele Google-sleutel) |
| `CNAME` | Vertelt GitHub dat de site op deekmanenterprises.com staat |
| `sitemap.xml`, `robots.txt`, `favicon.svg` | Voor Google en het icoontje in het tabblad |
| `logo-licht.svg`, `logo-donker.svg` | Je logo: licht (op donkerblauw, in menu en footer) en donker (op de 404-pagina) |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Icoontje in het tabblad en op het beginscherm van een telefoon |
| `og-image.png` | Plaatje dat verschijnt als iemand je site deelt via WhatsApp, LinkedIn enz. |
| `supabase/functions/website/index.ts` | Code voor de formulierfunctie (hoeft niet live, wel handig om te bewaren) |

---

## Stap 0 — Vóór je live gaat

Alles is ingevuld: Zwijndrecht als vestigingsplaats, reactietijd 2 à 3 werkdagen, je foto en de tekst bij "Over ons". Het portfolio staat er voorlopig niet in.

**Nog te doen:**
- **KvK-nummer:** als bedrijf ben je verplicht dit op je website te zetten. Heb je het, stuur het dan door, dan zet ik het onderaan elke pagina.
- **Privacyverklaring:** staat erin (`privacy.html`, gelinkt in de footer en bij de formulieren). Voeg je later iets toe, zoals Google Analytics of een nieuw formulier, pas dan ook de privacyverklaring aan.

---

## Stap 1 — Repository maken op GitHub

1. Ga naar https://github.com/Deekman-Enterprises en klik op **New** (nieuwe repository).
2. Naam: `website`.
3. Kies **Public**. Op het gratis abonnement werkt GitHub Pages alleen met openbare repositories, net als bij je andere apps.
4. Klik op **Create repository**.

## Stap 2 — Bestanden uploaden

1. Pak de zip uit op je computer.
2. Klik in de nieuwe repository op **uploading an existing file**.
3. Open de uitgepakte map en sleep **alles wat erin zit** naar het uploadvenster: alle bestanden plus de mappen `js` en `supabase`. Sleep níet de map zelf, anders komt alles een niveau te diep te staan.
4. Klik onderaan op **Commit changes**.
5. Controleer dat `index.html` en `CNAME` direct in de hoofdmap staan, en dat er niets hernoemd is naar iets als `index_2.html`. Dat gebeurde eerder bij het Werknemersportaal.

## Stap 3 — GitHub Pages aanzetten

1. Ga in de repository naar **Settings → Pages**.
2. Bij **Source** kies je **Deploy from a branch**, branch **main**, map **/ (root)**, en klik op **Save**.
3. Bij **Custom domain** moet `deekmanenterprises.com` staan; dat haalt GitHub uit het `CNAME`-bestand. Staat het er niet, vul het dan in en klik op **Save**.
4. GitHub geeft eerst een melding dat de DNS nog niet klopt. Dat los je in de volgende stap op.

## Stap 4 — Domein koppelen in Squarespace

Ga in Squarespace naar **Domains → deekmanenterprises.com → DNS** (of **DNS Settings → Custom records**).

**Toevoegen:**

| Host | Type | Waarde |
|---|---|---|
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `deekman-enterprises.github.io` |

Optioneel, voor IPv6: vier **AAAA**-records voor `@` met `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` en `2606:50c0:8003::153`.

**Verwijderen (als ze er staan):** de standaard-records van Squarespace voor `@` en `www`, bijvoorbeeld de "Squarespace Defaults" of een parkeerpagina. Die botsen met GitHub.

**Laten staan, niet aankomen:**
- de CNAME's `paginapuls`, `app` en `leerpuls` (je andere apps)
- de Resend-records (`send`, `rsend`, `resend._domainkey` of vergelijkbaar), anders stopt de mail van al je apps
- eventuele MX-records voor je e-mail

## Stap 5 — Wachten en HTTPS aanzetten

1. Ga terug naar **Settings → Pages** in GitHub. Na een paar minuten tot een paar uur wordt de DNS-check groen.
2. Vink **Enforce HTTPS** aan zodra dat kan. Het certificaat maken duurt meestal minder dan een uur, soms tot 24 uur.
3. Open https://deekmanenterprises.com in een **incognitovenster**, zodat je oude cache niet in de weg zit.

**Aanrader, eenmalig:** verifieer het domein in je GitHub-organisatie via **Organization settings → Pages → Add a domain**. Zo kan niemand anders jouw domein aan een eigen GitHub-site koppelen. GitHub laat zien welk TXT-record je daarvoor in Squarespace toevoegt.

## Stap 6 — Formulieren laten mailen (Supabase)

De formulieren gebruiken het bestaande Supabase-project **leerpuls** (`dtcoymzzhsqbdpkyxuti`). Daar staat de Resend-sleutel al als secret.

1. Ga in Supabase naar het project **leerpuls → Edge Functions → Deploy a new function → Via Editor**.
2. Naam: precies **`Website`**, met een hoofdletter W.
3. Plak de volledige inhoud van `supabase/functions/website/index.ts` en klik op **Deploy**.
4. Zet in de instellingen van de functie **Verify JWT** (of "Enforce JWT verification") **uit**, net als bij je Leerpuls-functies.
5. Secrets: `RESEND_API_KEY` bestaat al. Optioneel kun je er nog bij zetten:
   - `NOTIFY_EMAIL`: een ander ontvangstadres dan info@
   - `SITE_MAIL_FROM`: een andere afzender
6. Testen: vul op de live site het contactformulier in met je eigen adres. info@ krijgt het bericht (met "beantwoorden" reageer je direct aan de afzender), en jij krijgt een bevestiging.

Wat de functie verstuurt:
- **Contact:** het bericht naar info@, plus een bevestiging naar de afzender.
- **Website-bouwer:** alle keuzes naar info@, plus een bevestiging met samenvatting naar de aanvrager.
- **Updates (Binnenkort):** een melding naar info@ met het e-mailadres.

Ingebouwde bescherming:
- een verborgen anti-spamveld
- maximaal 10 berichten per uur per bezoeker
- alleen verzoeken vanaf je eigen domein worden door de browser toegelaten

Let op de Resend-limiet: op het gratis plan zijn dat 100 mails per dag, gedeeld met Leerpuls en Paginapuls.

## Stap 7 — Google-sleutel voor de website-check (aanrader)

De website-check werkt meteen, maar zonder sleutel geeft Google maar een klein aantal checks per dag. Met een gratis sleutel is dat ruim genoeg:

1. Ga naar https://console.cloud.google.com en kies het project **Deekman Enterprises apps**.
2. Ga naar **APIs & Services → Library**, zoek **PageSpeed Insights API** en klik op **Enable**.
3. Ga naar **APIs & Services → Credentials → Create credentials → API key**.
4. Klik op de nieuwe sleutel en beperk hem:
   - **Application restrictions → Websites**: `https://deekmanenterprises.com/*` en `https://www.deekmanenterprises.com/*`
   - **API restrictions → Restrict key → PageSpeed Insights API**
5. Open `config.js` in GitHub (potloodje), plak de sleutel tussen de aanhalingstekens bij `PSI_KEY` en klik op **Commit changes**.

Door die beperkingen werkt de sleutel alleen op jouw site en alleen voor deze check. Het is dan geen probleem dat hij zichtbaar in de code staat.

## Stap 8 — Gevonden worden in Google (aanrader)

1. Ga naar https://search.google.com/search-console, kies **Property toevoegen → Domein** en vul `deekmanenterprises.com` in.
2. Google geeft een TXT-record. Zet dat in Squarespace bij DNS en klik op **Verifiëren**.
3. Ga naar **Sitemaps** en voeg `sitemap.xml` toe.

Wil je bezoekersstatistieken? Dan kan ik Google Analytics toevoegen, zoals bij Paginapuls.

---

## Later iets aanpassen

- **Kleine wijziging:** open het bestand in GitHub, klik op het potloodje, pas aan en klik op **Commit changes**.
- **Nieuw bestand uploaden met dezelfde naam:** verwijder eerst het oude bestand of gebruik het potloodje. Anders maakt GitHub er `index_2.html` van en verandert er niks.
- Na een wijziging duurt het 1 tot 5 minuten voordat de site bijgewerkt is. Controleer in een incognitovenster.

## Problemen oplossen

| Wat je ziet | Oplossing |
|---|---|
| GitHub 404 "There isn't a GitHub Pages site here" | Controleer stap 3, en dat `index.html` in de hoofdmap staat (niet in een submap). |
| "Domain does not resolve" / DNS-check blijft rood | Controleer de A-records en de www-CNAME in Squarespace. Haal oude records voor `@` weg. Wacht tot een paar uur. |
| Enforce HTTPS is grijs | Het certificaat wordt nog gemaakt. Wacht en probeer later opnieuw. Even het domein weghalen en opnieuw opslaan in Pages helpt soms. |
| Formulier zegt "Versturen is niet gelukt" | Controleer in Supabase dat de functie precies `Website` heet en Verify JWT uit staat. Kijk bij **Edge Functions → Website → Logs** naar de fout. |
| Formulier lijkt te werken maar er komt geen mail | Kijk in Resend bij **Logs**, en in je spammap. |
| Website-check: "Het is even erg druk met checks" | Voeg de Google-sleutel toe (stap 7). |
| Oude versie blijft zichtbaar | Gebruik een incognitovenster of een harde refresh (Ctrl+Shift+R / Cmd+Shift+R). |
