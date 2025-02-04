# Generated by Django 5.1.5 on 2025-02-01 18:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_studysession'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='studysession',
            name='description',
        ),
        migrations.AddField(
            model_name='studysession',
            name='completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='studysession',
            name='learning_goal',
            field=models.CharField(choices=[('School', 'For School'), ('Portfolio', 'Build a Portfolio'), ('Career Growth', 'Career Growth')], default='School', max_length=50),
        ),
    ]
