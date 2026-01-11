#!/usr/bin/env python3
"""
Script to convert Quiz Questions.txt to quizQuestions.json format
"""

import json
import re

def parse_quiz_file(filename):
    """Parse the quiz questions text file and return structured data"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by levels
    level_sections = re.split(r'Level\s+(\d+)', content)
    
    quiz_data = {}
    
    # Process each level (skip first empty element)
    for i in range(1, len(level_sections), 2):
        level_num = level_sections[i].strip()
        level_content = level_sections[i + 1]
        
        level_questions = []
        
        # Try to find all questions by looking for numbered patterns
        # Split by question numbers followed by a period
        question_pattern = r'(?=^\d+\.\s+.+$)'
        question_blocks = re.split(question_pattern, level_content, flags=re.MULTILINE)
        
        for q_block in question_blocks:
            q_block = q_block.strip()
            if not q_block or not re.match(r'^\d+\.', q_block):
                continue
            
            lines = q_block.split('\n')
            
            # Extract question number and text from first line
            first_line = lines[0].strip()
            question_match = re.match(r'^(\d+)\.\s+(.+)$', first_line)
            if not question_match:
                continue
            
            question_num = int(question_match.group(1))
            question_text = question_match.group(2)
            
            # Collect remaining question text (might span multiple lines)
            question_parts = [question_text]
            line_idx = 1
            
            # Continue reading until we hit an option or answer
            while line_idx < len(lines):
                line = lines[line_idx].strip()
                if not line:
                    line_idx += 1
                    continue
                # If it's an option or answer, stop
                if re.match(r'^[A-E][).]\s', line) or re.match(r'^(?:Answer|Ans|Correct Answer):', line):
                    break
                # If it's not a separator line, add to question
                if not re.match(r'^_+$', line):
                    question_parts.append(line)
                line_idx += 1
            
            question_text = ' '.join(question_parts)
            
            # Extract options (A, B, C, D, E)
            options = []
            answer_letter = None
            
            for line in lines[line_idx:]:
                line = line.strip()
                
                # Check for option lines
                option_match = re.match(r'^([A-E])[).]\s*(.+)$', line)
                if option_match:
                    letter = option_match.group(1)
                    text = option_match.group(2).strip()
                    options.append({"letter": letter, "text": text})
                
                # Check for answer line (various formats)
                answer_match = re.match(r'^(?:Answer|Ans|Correct Answer):\s*([A-E])', line, re.IGNORECASE)
                if answer_match:
                    answer_letter = answer_match.group(1).upper()
            
            # If we have a valid question with options and answer
            if question_text and len(options) >= 2 and answer_letter:
                level_questions.append({
                    "number": question_num,
                    "question": question_text,
                    "options": options,
                    "answer": answer_letter
                })
        
        if level_questions:
            quiz_data[level_num] = level_questions
    
    return quiz_data

def main():
    input_file = 'public/assets/Quiz Questions.txt'
    output_file = 'public/assets/quizQuestions.json'
    
    print(f"Reading from: {input_file}")
    quiz_data = parse_quiz_file(input_file)
    
    print(f"\nParsed {len(quiz_data)} levels:")
    for level, questions in sorted(quiz_data.items(), key=lambda x: int(x[0])):
        print(f"  Level {level}: {len(questions)} questions")
    
    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(quiz_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nOutput written to: {output_file}")
    print("Conversion complete!")

if __name__ == "__main__":
    main()
