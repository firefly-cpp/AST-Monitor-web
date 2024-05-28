import os

def concatenate_files(source_folder, output_file):
    with open(output_file, 'w') as outfile:
        for root, _, files in os.walk(source_folder):
            for file in files:
                if file.endswith('.css'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r') as infile:
                        outfile.write(f"\n/* Start of {file} */\n\n")
                        outfile.write(infile.read())
                        outfile.write(f"\n/* End of {file} */\n\n")

if __name__ == "__main__":
    source_folder = 'C:/Users/Vanja/Desktop/Projekt/ast/AST-Monitor_web/frontend/src/Styles'  # Replace with the path to your folder
    output_file = 'output_file.css'        # Replace with the desired output file path
    concatenate_files(source_folder, output_file)
    print(f"All files concatenated into {output_file}")
