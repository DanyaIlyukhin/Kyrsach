async function fetchFields() {
    try {
        const response = await fetch('/select_fields'); // Убедитесь, что этот маршрут настроен на сервере
        
        if (!response.ok) throw new Error('Сеть не в порядке');
        
        const fields = await response.json();
        const fieldListDiv = document.getElementById('field-container'); // Предполагается, что у вас есть div с id "field-list"

        // Отображение полей
        fields.forEach(field => {
            const fieldItem = document.createElement('div');
            fieldItem.className = 'field-item';

            // Форматирование цены (если необходимо)
            const formattedPrice = field.price; // Предполагается, что цена уже в нужном формате

            // Оборачиваем карточку поля в ссылку
            fieldItem.innerHTML = `
                <a href="/field/${field.field_id}" style="text-decoration: none; color: inherit;">
                    <div class="field-card">
                        <img src="/image/${field.field_id}" alt="${field.name_field}" class="field-image">
                        <div class="field-details">
                            <h2 class="field-title">${field.name_field}</h2>
                            <h2 > ${field.address}</h2>
                            <h2 style="color:#0056b3;"><strong class="h2">${formattedPrice} ₽ / час </strong></h2>
                        </div>
                    </div>
                </a>
                `;
                fieldListDiv.appendChild(fieldItem);
        });
    } catch (error) {
        console.error(error); // Логируем ошибку в консоль
        alert('Не удалось загрузить данные о полях.'); // Уведомляем пользователя об ошибке
    }
}
