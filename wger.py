import os
import time
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

headers_supabase = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

# 🌐 DICTIONNAIRES DE TRADUCTION
CATEGORY_TRANSLATIONS = {
    "Abs": "Abdominaux",
    "Arms": "Bras",
    "Back": "Dos",
    "Calves": "Mollets",
    "Chest": "Pectoraux",
    "Legs": "Jambes",
    "Shoulders": "Epaules",
    "Cardio": "Cardio",
    "Stretching": "Etirements",
}

EQUIPMENT_TRANSLATIONS = {
    "Barbell": "Barre",
    "Dumbbell": "Haltere",
    "Gym mat": "Tapis de gym",
    "Swiss ball": "Ballon suisse",
    "Pull-up bar": "Barre de traction",
    "Bench": "Banc",
    "Incline bench": "Banc incline",
    "Kettlebell": "Kettlebell",
    "Resistance band": "Bande de resistance",
    "Machine": "Machine",
    "Cables": "Poulie",
    "Cable machine": "Poulie",
    "None (bodyweight)": "Poids du corps",
    "none (bodyweight exercise)": "Poids du corps",
}

MUSCLE_TRANSLATIONS = {
    "Biceps brachii": "Biceps",
    "Triceps brachii": "Triceps",
    "Pectoralis major": "Pectoraux",
    "Latissimus dorsi": "Grand dorsal",
    "Trapezius": "Trapezes",
    "Rectus abdominis": "Abdominaux",
    "Obliquus externus abdominis": "Obliques",
    "Quadriceps femoris": "Quadriceps",
    "Biceps femoris": "Ischio-jambiers",
    "Hamstrings": "Ischio-jambiers",
    "Soleus": "Soléaire",
    "Gastrocnemius": "Mollets",
    "Gluteus maximus": "Fessiers",
    "Anterior deltoid": "Epaules (faisceau anterieur)",
    "Deltoideus": "Epaules",
    "Serratus anterior": "Serratus / Dentele",
    "Brachialis": "Brachial",
    "Forearm flexors": "Flechisseurs des avant-bras",
    "Forearm extensors": "Extenseurs des avant-bras",
}


def sync_exercises():
  url = "https://wger.de/api/v2/exerciseinfo/?language=12&limit=50"
  total_synced = 0

  print("🔄 Début de la synchronisation des exercices...")

  while url:
    try:
      response = requests.get(url, timeout=10)
      if response.status_code != 200:
        print(f"❌ Erreur API Wger: {response.status_code}")
        break

      data = response.json()
      results = data.get("results", [])

      for ex in results:
        translations = ex.get("translations", [])
        name = None

        # 1. Recherche du français (langue 12)
        for trans in translations:
          if trans.get("language") == 12:
            name = trans.get("name")
            break

        # 2. Repli sur l'anglais (langue 2)
        if not name:
          for trans in translations:
            if trans.get("language") == 2:
              name = trans.get("name")
              break

        # 3. Ultime recours : nom brut de l'objet
        if not name:
          name = ex.get("name")

        # Extractions brutes
        muscles = ex.get("muscles", [])
        muscle_group_raw = muscles[0].get("name") if muscles else None

        equipment = ex.get("equipment", [])
        equip_name_raw = equipment[0].get("name") if equipment else None

        category_obj = ex.get("category")
        category_name_raw = (
            category_obj.get("name")
            if isinstance(category_obj, dict)
            else category_obj
        )

        # 🌐 Application des traductions propres
        category_name = CATEGORY_TRANSLATIONS.get(
            category_name_raw, category_name_raw
        )
        equip_name = EQUIPMENT_TRANSLATIONS.get(
            equip_name_raw, equip_name_raw
        )
        muscle_group = MUSCLE_TRANSLATIONS.get(
            muscle_group_raw, muscle_group_raw
        )

        # Description courte (max 250 caractères)
        desc = ex.get("description", "")
        if desc:
          desc = desc[:250]

        # Formats array pour Supabase
        equip_list = [equip_name] if equip_name else []
        muscle_list = [muscle_group] if muscle_group else []

        if name:
          payload = {
              "wger_id": ex.get("id"),
              "name": name,
              "category": category_name,
              "equipment": equip_list,
              "description": desc,
              "muscle_group": muscle_list,
          }

          try:
            res = requests.post(
                f"{SUPABASE_URL}/rest/v1/exercises",
                headers=headers_supabase,
                json=payload,
                timeout=5,
            )
            if res.status_code in [200, 201, 204, 409]:
              total_synced += 1
            else:
              print(
                  f"⚠️ Erreur insertion Supabase pour '{name}':"
                  f" {res.status_code} - {res.text}"
              )

            time.sleep(0.05)
          except Exception as err:
            print(f"⚠️ Exception réseau Supabase : {err}")
        else:
          print(
              "⚠️ Exercice totalement ignoré (aucun nom trouvé) ID:"
              f" {ex.get('id')}"
          )

      # Passage à la page suivante de l'API Wger
      url = data.get("next")

    except Exception as err:
      print(f"❌ Erreur lors de la récupération de l'API Wger : {err}")
      break

  print(
      f"✅ Synchronisation terminée ! {total_synced} exercices synchronisés."
  )


if __name__ == "__main__":
  sync_exercises()