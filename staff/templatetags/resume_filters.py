from django import template
from urllib.parse import urlparse

register = template.Library()


@register.filter(name='format_contact_url')
def format_contact_url(contact_obj):
    try:
        url = contact_obj.url
        parsed = urlparse(url)
        hostname = parsed.hostname or parsed.netloc
        pathname = parsed.path.rstrip('/')
        return f"{hostname.replace('www.', '')}{pathname}"
    except Exception:
        return url


@register.filter(name='parse_skill')
def parse_skill(skill_obj):
    parts = skill_obj.skill.split(':', 1)
    if len(parts) < 2:
        return {
            'category': 'Skills',
            'list': skill_obj.skill
        }
    return {
        'category': parts[0].strip(),
        'list': parts[1].strip()
    }