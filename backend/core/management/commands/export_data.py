import json
import os
from django.core.management.base import BaseCommand
from django.core.serializers import serialize
from django.apps import apps

class Command(BaseCommand):
    help = 'Export database data to JSON file with proper UTF-8 encoding'

    def handle(self, *args, **options):
        data = []
        
        # Get all models from all apps
        for model in apps.get_models():
            # Skip some Django built-in models that might cause issues
            if model._meta.app_label in ['contenttypes', 'admin', 'sessions']:
                continue
                
            try:
                # Serialize all objects from this model
                model_data = serialize('json', model.objects.all())
                if model_data != '[]':  # Only add if there's data
                    # Parse and extend the data list
                    parsed_data = json.loads(model_data)
                    data.extend(parsed_data)
                    self.stdout.write(f'Exported {len(parsed_data)} records from {model._meta.label}')
            except Exception as e:
                self.stdout.write(f'Error exporting {model._meta.label}: {str(e)}')
                continue
        
        # Write to file with UTF-8 encoding
        try:
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully exported {len(data)} records to data.json')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error writing to file: {str(e)}')
            )