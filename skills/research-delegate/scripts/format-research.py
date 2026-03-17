#!/usr/bin/env python3
"""
Research Output Formatter

Helper script to format research findings into the standard research markdown format.
Usage: python format-research.py --topic "Topic" --findings "findings.md" --output "output.md"
"""

import argparse
import os
import re
from datetime import datetime
from pathlib import Path


def slugify(text: str) -> str:
    """Convert topic to filesystem-safe slug."""
    # Lowercase, replace spaces with hyphens, remove non-alphanumeric
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[-\s]+', '-', slug)    # Replace spaces with hyphens
    return slug.strip('-')


def get_current_date() -> str:
    """Get current UTC date in YYYY-MM-DD format."""
    return datetime.utcnow().strftime('%Y-%m-%d')


def format_research_markdown(topic: str, findings: str, sources: list = None) -> str:
    """
    Format research findings into standard research markdown.
    
    Args:
        topic: The research topic
        findings: The research findings (markdown content)
        sources: Optional list of source URLs
    
    Returns:
        Formatted markdown string
    """
    date = get_current_date()
    slug = slugify(topic)
    
    # Build the markdown
    output = f"""# {topic} Research

**Date:** {date}  
**Status:** In Progress  
**Researcher:** Ceil (via subagent delegation)

---

## Executive Summary

{findings.split('---')[0] if '---' in findings else findings[:500]}

---

"""
    
    # Add detailed findings (everything after first --- or full text)
    if '---' in findings:
        parts = findings.split('---', 1)
        if len(parts) > 1:
            output += parts[1].strip()
    else:
        output += findings
    
    # Add sources if provided
    if sources:
        output += "\n\n---\n\n## Sources\n\n"
        for i, source in enumerate(sources, 1):
            output += f"- {source}\n"
    
    return output


def append_to_file(filepath: str, content: str) -> None:
    """
    Append content to file, creating directories if needed.
    Never overwrites existing content.
    """
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'a', encoding='utf-8') as f:
        f.write(content)


def main():
    parser = argparse.ArgumentParser(description='Format research findings')
    parser.add_argument('--topic', required=True, help='Research topic')
    parser.add_argument('--findings', help='Path to findings file')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--sources', nargs='*', help='Source URLs')
    
    args = parser.parse_args()
    
    # Read findings
    if args.findings:
        with open(args.findings, 'r', encoding='utf-8') as f:
            findings = f.read()
    else:
        findings = input("Enter findings: ")
    
    # Format
    formatted = format_research_markdown(args.topic, findings, args.sources)
    
    # Output
    if args.output:
        append_to_file(args.output, formatted)
        print(f"Research saved to: {args.output}")
    else:
        print(formatted)


if __name__ == '__main__':
    main()
