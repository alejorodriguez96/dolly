

with open('gente.txt', 'r') as gente:
    with open('gente2.txt', 'w') as nuevo:
        contador = 0
        for linea in gente:
            if contador == 0:
                contador += 1
                continue
            list = linea.rstrip('\n').split(',')
            if len(list) == 14:
                list.insert(13,"0")
            else:
                list.append("0")
            nuevo.write(','.join(list) + '\n')
